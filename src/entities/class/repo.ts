import { PrismaClient } from '@prisma/client';
import { Entity } from '..';
import { ClientUuid, Uuid, logError, Category } from '../../utils';
import { ValidatedClass } from '../class';

export const prisma = new PrismaClient();

export class ClassRepo {
  public static async insertOne(classDetails: ValidatedClass): Promise<void> {
    try {
      await prisma.class.create({
        data: await classDetails.mapToDatabaseInput(),
      });
    } catch (error) {
      throw logError(
        error,
        Entity.CLASS,
        classDetails.clientUuid,
        Category.POSTGRES,
        {
          msg: 'Failed create class in datatabase',
          props: {
            name: classDetails.name,
            orgName: classDetails.organizationName,
            schoolName: classDetails.schoolName,
          },
        }
      );
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
      throw logError(error, Entity.CLASS, 'UNKNOWN', Category.POSTGRES, {
        msg: 'Failed find class ID in database',
        props: {
          name: className,
          orgId,
          schoolId,
        },
      });
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
      throw logError(error, Entity.CLASS, 'UNKNOWN', Category.POSTGRES, {
        msg: 'Failed find class IDs with the given program ID',
        props: {
          programId,
          orgId: clientOrgUuid,
        },
      });
    }
  }
}
