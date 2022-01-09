import { log, validate, ClientUuid, Uuid, ProcessChain } from '../utils';
import { PrismaClient, Organization as DbOrg, Prisma } from '@prisma/client';
import { organizationSchema } from '../validatorsSchemes';
import { Entity, Programs, Roles } from '.';
import { UserService } from '../api/userService';
import { ValidationError } from '../utils/errors';
import { Api } from '../api/c1Api';

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
  public static async insertOne(
    organization: ValidatedOrganization
  ): Promise<void> {
    try {
      const org = await prisma.organization.create({
        data: await organization.mapToDatabaseInput(),
      });
      if (!org)
        throw new Error(`Unable to insert organization: ${organization.name}`);
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
  public static async findByOrganizationName(name: string): Promise<DbOrg> {
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

export class Organization
  implements ProcessChain<IOrganization, ValidatedOrganization>
{
  public readonly schema = organizationSchema;
  public readonly entity = Entity.ORGANIZATION;

  private constructor(public readonly data: IOrganization) {}

  public getEntityId(): string {
    return this.data.OrganizationUUID;
  }

  public async validate(): Promise<ValidatedOrganization> {
    const org = await ValidatedOrganization.validate(this);
    return org;
  }

  public async insertOne(item: ValidatedOrganization): Promise<void> {
    await OrganizationRepo.insertOne(item);
  }

  public async process(): Promise<ValidatedOrganization> {
    const org = await this.validate();
    const kidsloopId = org.kidsloopUuid;
    await this.insertOne(org);
    const programs = await Programs.initialize();
    await programs.fetchAndStoreProgramsForOrg(kidsloopId);
    const roles = await Roles.initialize();
    await roles.fetchAndStoreRolesForOrg(kidsloopId);
    return org;
  }

  public getOrganizationName(): string {
    return this.data.OrganizationName;
  }

  public static async fetchAll(): Promise<Organization[]> {
    const api = await Api.getInstance();
    const orgs = await api.getAllOrganizations();
    return orgs.map((o) => new Organization(o));
  }

  public static async fetch(id: ClientUuid): Promise<Organization> {
    const api = await Api.getInstance();
    const org = await api.getOrganization(id);
    return new Organization(org);
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
    v: Organization
  ): Promise<ValidatedOrganization> {
    const data = await validate<
      IOrganization,
      Organization,
      ValidatedOrganization
    >(v);
    try {
      const userService = await UserService.getInstance();
      const { klUuid, klShortCode } = await userService.getOrganization(
        data.OrganizationName
      );
      return new ValidatedOrganization(data, klUuid, klShortCode);
    } catch (error) {
      const e = new ValidationError(
        Entity.ORGANIZATION,
        v.data.OrganizationUUID,
        [
          {
            path: `${v.data.OrganizationUUID}`,
            details: `Unable to find Organization: ${v.data.OrganizationName} in the system`,
          },
        ]
      );
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
