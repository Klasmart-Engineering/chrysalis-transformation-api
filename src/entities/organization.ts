import { log, validate, Validator, ClientUuid, Uuid } from '../utils';
import { PrismaClient, Organization, Prisma } from '@prisma/client';
import { organizationSchema } from '../validatorsSchemes';
import { Entity } from '.';
import { UserService } from '../api/userService';
import { ValidationError } from '../utils/errors';

const prisma = new PrismaClient();

export interface IOrganization {
  OrganizationName: string;
  OrganizationUUID: string;
}

export class OrganizationRepo {
  /**
   *
   * @TODO - When an organization is created, we then need to go and
   * create all the associated roles and programs for that organization
   *
   * @param {ValidatedOrganization} organization - A validated organization
   * ready to be inserted into the database
   * @returns {void}
   * @throws If an error occurred while trying to create the record in the
   * database
   */
  public static async createOne(
    organization: ValidatedOrganization
  ): Promise<void> {
    try {
      const org = await prisma.organization.create({
        data: await organization.mapToDatabaseInput(),
      });
      if (!org)
        throw new Error(`Unable to create organization: ${organization.name}`);
      return;
    } catch (error) {
      log.error('Failed to create organization in database', {
        error,
        name: organization.name,
        id: organization.clientUuid,
        entity: Entity.ORGANIZATION,
      });
      throw error;
    }
  }

  /**
   * @param {string} name - The name of the organization
   * @returns {Org} The orgization information
   * @throws If the organization was not found or a database error occurred
   */
  public static async findByOrganizationName(
    name: string
  ): Promise<Organization> {
    try {
      const org = await prisma.organization.findFirst({
        where: {
          name,
        },
      });
      if (!org) throw new Error(`Organization: ${name} was not found`);
      return org;
    } catch (error) {
      log.error('Failed to find organization in database', {
        error,
        name,
        entity: Entity.ORGANIZATION,
      });
      throw error;
    }
  }

  /**
   * @param {string} name - The name of the organization
   * @returns {string} The Client UUID for the organization
   */
  public static async findClientOrgIdByName(name: string): Promise<ClientUuid> {
    try {
      const org = await prisma.organization.findFirst({
        where: {
          name,
        },
        select: {
          clientUuid: true,
        },
      });
      if (!org) throw new Error(`Organization: ${name} was not found`);
      return org.clientUuid;
    } catch (error) {
      log.error('Failed to find organization in database', {
        error,
        name,
        entity: Entity.ORGANIZATION,
      });
      throw error;
    }
  }

  /**
   * @param {string} name - The name of the organization
   * @returns {string} The KidsLoop UUID for the organization
   */
  public static async findKidsLoopOrgIdByName(name: string): Promise<Uuid> {
    try {
      const org = await prisma.organization.findFirst({
        where: {
          name,
        },
        select: {
          klUuid: true,
        },
      });
      if (!org) throw new Error(`Organization: ${name} was not found`);
      return org.klUuid;
    } catch (error) {
      log.error('Failed to find organization in database', {
        error,
        name,
        entity: Entity.ORGANIZATION,
      });
      throw error;
    }
  }
}

export class OrganizationToBeValidated implements Validator<IOrganization> {
  public schema = organizationSchema;
  public entity = Entity.ORGANIZATION;

  constructor(public data: IOrganization) {}

  getEntityId(): string {
    return this.data.OrganizationUUID;
  }

  getOrganizationName(): string {
    return this.data.OrganizationName;
  }
}

export class ValidatedOrganization {
  private data: IOrganization;

  private constructor(
    org: IOrganization,
    private klUuid: Uuid,
    private klShortCode: string
  ) {
    this.data = org;
  }

  get name(): string {
    return this.data.OrganizationName;
  }

  get clientUuid(): ClientUuid {
    return this.data.OrganizationUUID;
  }

  get kidsloopUuid(): Uuid {
    return this.klUuid;
  }

  get kidsloopShortCode(): Uuid {
    return this.kidsloopShortCode;
  }

  /**
   * Note: Because an Organization should already exist in the KidsLoop
   * User Service prior to the onboarding occurring, this function validates
   * that it has correctly been added.
   *
   * This is currently the only entity where this behaviour occurs.
   *
   * @param {IOrganization} org - The organization data to be validated
   * @returns {ValidatedOrganization} A validated organization
   * @throws If the organization is invalid
   */
  public static async validate(
    o: IOrganization
  ): Promise<ValidatedOrganization> {
    const v = new OrganizationToBeValidated(o);
    const data = await validate<IOrganization, OrganizationToBeValidated>(v);
    try {
      const userService = await UserService.getInstance();
      const { klUuid, klShortCode } = await userService.getOrganization(
        data.OrganizationName
      );
      return new ValidatedOrganization(data, klUuid, klShortCode);
    } catch (error) {
      const e = new ValidationError(Entity.ORGANIZATION, o.OrganizationUUID, [
        {
          path: `${o.OrganizationUUID}`,
          details: `Unable to find Organization: ${o.OrganizationName} in the system`,
        },
      ]);
      e.log();
      throw e;
    }
  }

  /**
   * Maps the data held internally into a format required for a database
   * create object
   */
  public async mapToDatabaseInput(): Promise<Prisma.OrganizationCreateInput> {
    return {
      clientUuid: this.clientUuid,
      name: this.name,
      klUuid: this.kidsloopUuid,
      klShortCode: this.klShortCode,
    };
  }
}
