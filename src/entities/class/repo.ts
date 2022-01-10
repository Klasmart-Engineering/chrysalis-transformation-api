import { PrismaClient } from '@prisma/client';
import { Entity } from '..';
import { log, ClientUuid, Uuid } from '../../utils';
import { ValidatedClass } from '../class';

export const prisma = new PrismaClient();

export class ClassRepo {
  public static async insertOne(classDetails: ValidatedClass): Promise<void> {
    try {
      await prisma.class.create({
        data: await classDetails.mapToDatabaseInput(),
      });
    } catch (error) {
      log.error('Failed to insert class into database', {
        error,
        id: classDetails.clientUuid,
        name: classDetails.name,
        entity: Entity.CLASS,
      });
    }
  }

  public static async findClassClientIdByClassName(
    orgId: ClientUuid,
    schoolId: ClientUuid,
    className: string
  ): Promise<ClientUuid> {
    try {
      const id = await prisma.class.findFirst({
        where: {
          AND: [
            { name: className },
            { clientOrgUuid: orgId },
            { clientSchoolUuid: schoolId },
          ],
        },
        select: {
          clientUuid: true,
        },
      });
      if (!id) throw new Error(`Class ${className} was not found`);
      return id.clientUuid;
    } catch (error) {
      log.error('Failed to find class id in database', {
        error,
        name: className,
        entity: Entity.CLASS,
      });
      throw error;
    }
  }

  public static async getClassIdsWithProgram(
    programId: Uuid,
    clientOrgUuid: ClientUuid
  ): Promise<ClientUuid[]> {
    try {
      const classes = await prisma.class.findMany({
        where: {
          clientOrgUuid,
          programUuids: {
            has: programId,
          },
        },
        select: {
          clientUuid: true,
        },
      });
      return classes.map((c) => c.clientUuid);
    } catch (error) {
      log.error('Failed to find classes with the given program id', {
        error,
        organizationId: clientOrgUuid,
        entity: Entity.CLASS,
        programId,
      });
      throw error;
    }
  }
}
