import { Uuid, log, Validator } from '.';
import { Api } from '../api/c1Api';
import {
  ClassRepo,
  ClassToBeValidated,
  Entity,
  OrganizationRepo,
  OrganizationToBeValidated,
  Programs,
  Roles,
  SchoolRepo,
  SchoolToBeValidated,
  UserRepo,
  UserToBeValidated,
  ValidatedOrganization,
} from '../entities';
import { instanceOfToFeedback } from './feedback';
import { Redis } from './redis';

type Json = string;

export interface IMessage {
  entity: Entity;
  entityId: Uuid;
  rawEntityData?: Json;

  requestTrace: Uuid;
  attempts: number;
  cascade: boolean;
  fullMigration?: boolean;
}

export class Message {
  constructor(
    public readonly entity: Entity,
    public readonly entityId: Uuid,
    public readonly requestTrace: Uuid,
    private attempts: number,
    public readonly cascade: boolean,
    public readonly fullMigration = false,
    public readonly redisMessageId?: string
  ) {}

  public static parse(data: Json, redisMessageId?: string): Message {
    const {
      entity,
      entityId,
      requestTrace,
      attempts,
      cascade,
      fullMigration,
    }: IMessage = JSON.parse(data);
    return new Message(
      entity,
      entityId,
      requestTrace,
      attempts,
      cascade,
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
      fullMigration: this.fullMigration,
    } as IMessage);
  }

  get processingAttempts(): number {
    return this.attempts;
  }

  public generateCascadedMessage(): Message {
    if (!this.cascade) {
      log.error(`Attempted to cascade a message that shouldn't have been`, {
        error: 'Incorrect application behaviour',
        trace: this.requestTrace,
        entity: this.entity,
        id: this.entityId,
        cascade: this.cascade,
      });
      throw new Error('Incorrect application behaviour');
    }
    const newEntity: Entity = Entity.USER;
    switch (this.entity) {
      case Entity.ORGANIZATION:
        newEntity = Entity.SCHOOL;
        break;
      case Entity.SCHOOL:
      case Entity.CLASS:
      default:
        log.error(`Attempted to cascade a message that shouldn't have been`, {
          error: 'Incorrect application behaviour',
          trace: this.requestTrace,
          entity: this.entity,
          id: this.entityId,
          cascade: this.cascade,
        });
        throw new Error('Incorrect application behaviour');
    }
    return new Message();
  }

  public async process(): Promise<void> {
    this.attempts += 1;
    const entity = this.entity;
    if (this.fullMigration && entity === Entity.ORGANIZATION) {
      return await this.processFullMigration();
    }
    const parentEntityId: ClientUuid | undefined = undefined;
    const api = 
    while (true) {
      switch (this.entity) {
        case Entity.ORGANIZATION:
          const dataToValidate = await OrganizationToBeValidated.fetch(
            this.entityId
          );
          const data = await dataToValidate.validate();
          const klOrgId = data.kidsloopUuid;
          await OrganizationRepo.insertOne(data);
          const programs = await Programs.initialize();
          await programs.fetchAndStoreProgramsForOrg(klOrgId);
          const roles = await Roles.initialize();
          await roles.fetchAndStoreRolesForOrg(klOrgId);
          if (this.cascade) {
            const schoolIds = await SchoolToBeValidated.fetchAllForOrganization(data.clientUuid);
          }
          break;
        case Entity.SCHOOL:
          const dataToValidate = await SchoolToBeValidated.fetch(this.entityId);
          const data = await dataToValidate.validate();
          await SchoolRepo.insertOne(data);
          break;
        case Entity.CLASS:
          const dataToValidate = await ClassToBeValidated.fetch(this.entityId);
          const data = await dataToValidate.validate();
          await ClassRepo.insertOne(data);
          break;
        case Entity.USER:
          const dataToValidate = await UserToBeValidated.fetch(this.entityId);
          const data = await dataToValidate.validate();
          await UserRepo.insertOne(data);
          break;
        default:
          // PROGRAM & ROLE should be processed when
          // processing an ORGANIZATION
          return;
      }
      if (!this.cascade) break;
    }
  }

  private async processFullMigration(): Promise<void> {
    log.info('Attempting to start full migration', {
      trace: this.requestTrace,
      attempts: this.processingAttempts,
    });
    const orgs = await OrganizationToBeValidated.fetchAll();
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

export async function process<T, V>(data: Validator<T, V>[]): Promise<void> {
  for (const d of data) {
    const entity = d.entity;
    const data = d.validate();
      switch (entity) {
        case Entity.ORGANIZATION:
          const data = await d.validate();
          const klOrgId = data.kidsloopUuid;
          await OrganizationRepo.insertOne(data);
          const programs = await Programs.initialize();
          await programs.fetchAndStoreProgramsForOrg(klOrgId);
          const roles = await Roles.initialize();
          await roles.fetchAndStoreRolesForOrg(klOrgId);
          if (this.cascade) {
            const schoolIds = await SchoolToBeValidated.fetchAllForOrganization(data.clientUuid);
          }
          break;
        case Entity.SCHOOL:
          const data = await d.validate();
          await SchoolRepo.insertOne(data);
          break;
        case Entity.CLASS:
          const data = await d.validate();
          await ClassRepo.insertOne(data);
          break;
        case Entity.USER:
          const data = await d.validate();
          await UserRepo.insertOne(data);
          break;
        default:
          // PROGRAM & ROLE should be processed when
          // processing an ORGANIZATION
          return;
      }
  }
}
