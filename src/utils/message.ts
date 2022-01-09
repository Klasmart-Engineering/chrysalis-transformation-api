import { Uuid, log, ClientUuid } from '.';
import { Api } from '../api/c1Api';
import { MESSAGE_PROCESSING_ATTEMPTS } from '../consumer';
import { Class, Entity, Organization, School, User } from '../entities';
import { logError, UnexpectedError } from './errors';
import { instanceOfToFeedback } from './feedback';
import { Redis } from './redis';

type Json = string;

export enum ProcessingStage {
  FETCH_DATA,
  UPDATE_USER_SERVICE,
}

export interface IMessage {
  entity: Entity;
  entityId: Uuid;
  rawEntityData?: Json;

  requestTrace: Uuid;
  attempts: number;
  cascade: boolean;
  stage: ProcessingStage;
  fullMigration?: boolean;
}

export class Message {
  constructor(
    public readonly entity: Entity,
    public readonly entityId: Uuid,
    public readonly requestTrace: Uuid,
    private attempts: number,
    public readonly cascade: boolean,
    public readonly stage = ProcessingStage.FETCH_DATA,
    private readonly fullMigration = false,
    public readonly redisMessageId?: string
  ) {}

  public static parse(data: Json, redisMessageId?: string): Message {
    const {
      entity,
      entityId,
      requestTrace,
      attempts,
      cascade,
      stage,
      fullMigration,
    }: IMessage = JSON.parse(data);
    return new Message(
      entity,
      entityId,
      requestTrace,
      attempts,
      cascade,
      stage,
      fullMigration,
      redisMessageId
    );
  }

  public toJson(): Json {
    return JSON.stringify({
      entity: this.entity,
      entityId: this.entityId,
      requestTrace: this.requestTrace,
      attempts: this.attempts,
      cascade: this.cascade,
      stage: this.stage,
      fullMigration: this.fullMigration,
    } as IMessage);
  }

  get processingAttempts(): number {
    return this.attempts;
  }

  public async process(): Promise<void> {
    switch (this.stage) {
      case ProcessingStage.FETCH_DATA: {
        await this.processFetchData();
        break;
      }
      case ProcessingStage.UPDATE_USER_SERVICE: {
        // @TODO
        break;
      }
      default:
        throw new Error('Unreachable');
    }
  }

  /**
   * The logic behind this processing is fairly complex, but necessarily so.
   * There are a few core concepts to be understood in-order to grasp the whole
   * picture.
   *
   * # Heirarchy
   *
   * There is a strong heirarchy between our Entities:
   * Organization -> School -> Class -> User
   * Therefore all entries for the `parent entity` must have been
   * processed BEFORE we start to process the `child entity`.
   *
   * For example if we try and add users before we've finished
   * adding all of the classes. The validation on the class names
   * (contained within the users) will fail, and therefore the
   * users will be guaranteed to be rejected.
   *
   * Similarly if we try and add a class before a school, it will
   * fail validation as a class must belong to a school.
   *
   * # Two method of processing
   *
   * ## Cascade
   *
   * This is intented to be used when we've done no processing for a given
   * organization and we want to onboard absolutely everything.
   *
   * The path the cascade follows depends on the Entity it is initialized under:
   * - ORGANIZATION -> School -> (1st) Classes
   *                          -> (2nd) Users
   *
   * - SCHOOL -> (1st) Classes
   *          -> (2nd) Users
   *
   * - CLASS -> Users
   *
   * - USER (No cascade possible)
   *
   * In the event that an error occurs anywhere along the processing chain
   * we will NOT process any child elements of that entity. Instead we will
   * continue with another peer of that Entity.
   *
   * eg. If School `A` fails, we will stop processing School `A` and everything
   * associated to it, and move on to School `B`
   *
   * ## Straight Update
   *
   * This looks up the entity with the given ID and then processes it. Stopping
   * as soon as it is done. We don't try and update any child or associated
   * entities.
   *
   * ## Notes
   *
   * Both processing methods are read from the stream, and can (theoretically)
   * be done in parallel by separate workers. However once a `Cascade` has
   * started it must be continued on the same worker until completion or
   * failure. This is due to the validation mentioned above and the
   * asyncronosity of using streams, if we were to try
   * and fan out multiple stages of the cascade to multiple workers, there's no
   * guarantee that a child entity would be picked up to be processed before a
   * parent one.
   *
   */
  private async processFetchData(): Promise<void> {
    this.attempts += 1;
    const entity = this.entity;
    if (this.fullMigration && entity === Entity.ORGANIZATION) {
      return await this.processFullMigration();
    }
    try {
      switch (this.entity) {
        case Entity.ORGANIZATION: {
          const o = await Organization.fetch(this.entityId);
          const orgId = (await o.process()).clientUuid;
          if (this.cascade) await this.cascadeOrganization(orgId);
          break;
        }
        case Entity.SCHOOL: {
          const s = await School.fetch(this.entityId);
          const schoolId = (await s.process()).clientUuid;
          if (this.cascade) await this.cascadeSchool(schoolId);
          break;
        }
        case Entity.CLASS: {
          const c = await Class.fetch(this.entityId);
          const classId = (await c.process()).clientUuid;
          if (this.cascade) await this.cascadeClass(classId);
          break;
        }
        case Entity.USER: {
          const u = await User.fetch(this.entityId);
          await u.process();
          // Can't cascade further than a user
          break;
        }
        default:
          // PROGRAM & ROLE should be processed when
          // processing an ORGANIZATION
          log.warn(
            `Was processing an incoming message but found Entity as ${this.entity} this is unexpected behaviour`
          );
          return;
      }
    } catch (e) {
      logError(e);
      throw e;
    }
  }

  private async cascadeOrganization(orgId: ClientUuid): Promise<void> {
    const schools = await School.fetchAllForOrganization(orgId);
    const successfulSchools: ClientUuid[] = await this.processSchools(schools);
    for (const s of successfulSchools) {
      await this.cascadeSchool(s);
    }
  }

  private async cascadeSchool(schoolId: ClientUuid): Promise<void> {
    const classes = await Class.fetchAllForSchool(schoolId);

    // This step can error and interupt the function, this is because if
    // all the classes aren't created successfully it's likely that
    // we will fail user validation if a user belongs to the failed class
    await this.processClasses(classes);

    const users = await User.fetchAllForSchool(schoolId);
    await this.processUsers(users);
  }

  private async cascadeClass(classId: ClientUuid): Promise<void> {
    const users = await User.fetchAllForClass(classId);
    await this.processUsers(users);
  }

  private async processSchools(schools: School[]): Promise<string[]> {
    const api = await Api.getInstance();
    const successfulSchools: ClientUuid[] = [];
    for (const s of schools) {
      try {
        await s.process();
        successfulSchools.push(s.getEntityId());
      } catch (e) {
        const err = instanceOfToFeedback(e)
          ? e
          : new UnexpectedError(s.entity, s.data.SchoolName, s.getEntityId());
        logError(err);
        try {
          if (this.processingAttempts === MESSAGE_PROCESSING_ATTEMPTS) {
            await api.postFeedback(err.toFeedback());
          }
        } catch (_) {
          /*logged in method call*/
        }
      }
    }
    return successfulSchools;
  }

  private async processClasses(classes: Class[]): Promise<void> {
    let didError = false;
    const api = await Api.getInstance();
    for (const c of classes) {
      try {
        await c.process();
      } catch (e) {
        didError = true;
        const err = instanceOfToFeedback(e)
          ? e
          : new UnexpectedError(c.entity, c.data.ClassName, c.getEntityId());
        logError(err);
        try {
          if (this.processingAttempts === MESSAGE_PROCESSING_ATTEMPTS) {
            await api.postFeedback(err.toFeedback());
          }
        } catch (_) {
          /*logged in method call*/
        }
      }
    }
    if (didError) throw new Error('Processing errored so interrupting cascade');
  }

  private async processUsers(users: User[]): Promise<void> {
    const api = await Api.getInstance();
    for (const u of users) {
      try {
        await u.process();
      } catch (e) {
        const err = instanceOfToFeedback(e)
          ? e
          : new UnexpectedError(u.entity, '', u.getEntityId());
        logError(err);
        try {
          if (this.processingAttempts === MESSAGE_PROCESSING_ATTEMPTS) {
            await api.postFeedback(err.toFeedback());
          }
        } catch (_) {
          /*logged in method call*/
        }
      }
    }
  }

  /**
   * This function fetches all Organizations from the API
   * and queues each one onto the stream ready to be picked up
   * by workers
   *
   * In and of itself, this function does no actual processing
   *
   */
  private async processFullMigration(): Promise<void> {
    log.info('Attempting to start full migration', {
      trace: this.requestTrace,
      attempts: this.processingAttempts,
    });
    const orgs = await Organization.fetchAll();
    const redis = await Redis.initialize();
    const errors = [];
    for (const org of orgs) {
      try {
        const msg = new Message(
          Entity.ORGANIZATION,
          org.getEntityId(),
          this.requestTrace,
          0,
          this.cascade,
          ProcessingStage.FETCH_DATA,
          false
        );
        await redis.publishMessage(msg);
      } catch (e) {
        /* Errors should already be logged */
        errors.push(e);
      }
    }
    if (errors.length > 0) throw errors;
    log.info('Successfully set of full migration', {
      trace: this.requestTrace,
    });
    return;
  }
}
