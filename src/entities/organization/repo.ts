import { log, ClientUuid, Uuid } from '../../utils';
import { Organization as DbOrg, PrismaClient } from '@prisma/client';
import { Entity } from '..';
import { ValidatedOrganization } from './validated';

const prisma = new PrismaClient();

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
