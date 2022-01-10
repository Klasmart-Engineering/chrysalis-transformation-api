import { PrismaClient } from '@prisma/client';
import { Entity } from '..';
import { log } from '../../utils';
import { Role, RoleName } from '.';

type OrganizationId = string;

const prisma = new PrismaClient();

export class RoleRepo {
  public static async insertOne(role: Role): Promise<void> {
    try {
      await prisma.role.create({
        data: await role.mapToDatabaseInput(),
      });
    } catch (error) {
      log.error('Failed to insert role into database', {
        error,
        entity: Entity.ROLE,
        id: role.kidsloopUuid,
        name: role.name,
      });
    }
  }

  public static async findRoleByNameForOrganization(
    roleName: RoleName,
    org: OrganizationId
  ): Promise<Role> {
    try {
      const role = await prisma.role.findFirst({
        where: {
          name: roleName,
          clientOrgUuid: org,
        },
        select: {
          klUuid: true,
          name: true,
          clientOrgUuid: true,
        },
      });
      if (!role)
        throw new Error(`Role ${roleName} not found for Organization ${org}`);
      return new Role(role.klUuid, role.name, false, role.clientOrgUuid!);
    } catch (error) {
      log.error(
        'Failed to find role in database when searching with organisation id',
        {
          error,
          name: roleName,
          organisationId: org,
          entity: Entity.ROLE,
        }
      );
      throw error;
    }
  }

  public static async findManyByOrganizationId(
    org: OrganizationId
  ): Promise<Role[]> {
    try {
      const roles = await prisma.role.findMany({
        where: {
          clientOrgUuid: org,
        },
        select: {
          klUuid: true,
          name: true,
          clientOrgUuid: true,
        },
      });
      return roles.map(
        ({ klUuid, name, clientOrgUuid }) =>
          new Role(klUuid, name, false, clientOrgUuid!)
      );
    } catch (error) {
      log.error(
        'Failed to find roles in database when searching with organisation id',
        {
          error,
          organisationId: org,
          entity: Entity.ROLE,
        }
      );
      throw error;
    }
  }
}
