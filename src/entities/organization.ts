import log from '../utils/logging';
import { PrismaClient, Organization, Prisma } from '@prisma/client';
import { organizationSchema } from '../validatorsSchemes';
import { ClientUuid } from '../utils';
import { logError, ValidationError } from '../utils/errors';
import { Entity } from '.';
import { validate, Validator } from '../utils/validations';

const prisma = new PrismaClient();

export interface IOrganization {
  OrganizationName: string;
  OrganizationUUID: string;
}

export class OrganizationRepo {
  /**
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
      });
      throw error;
    }
  }

  /**
   * @param {string} name - The name of the organization
   * @returns {string} The Client UUID for the organization
   */
  public static async findOrgIdByName(name: string): Promise<string> {
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

  private constructor(org: IOrganization) {
    this.data = org;
  }

  get name(): string {
    return this.data.OrganizationName;
  }

  get clientUuid(): ClientUuid {
    return this.data.OrganizationUUID;
  }

  /**
   * @param {IOrganization} org - The organization data to be validated
   * @returns {ValidatedOrganization} A validated organization
   * @throws If the organization is invalid
   */
  public static async validate(
    o: IOrganization
  ): Promise<ValidatedOrganization> {
    const v = new OrganizationToBeValidated(o);
    const data = await validate<IOrganization, OrganizationToBeValidated>(v);
    return new ValidatedOrganization(data);
  }

  /**
   * Maps the data held internally into a format required for a database
   * create object
   */
  public async mapToDatabaseInput(): Promise<Prisma.OrganizationCreateInput> {
    return {
      clientUuid: this.clientUuid,
      name: this.name,
    };
  }
}
