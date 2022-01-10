import { ClientUuid, Uuid, logError, Category } from '../../utils';
import { Entity } from '..';
import { ValidatedSchool } from './validated';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SchoolRepo {
  public static async insertOne(school: ValidatedSchool): Promise<void> {
    try {
      await prisma.school.create({
        data: await school.mapToDatabaseInput(),
      });
    } catch (error) {
      throw logError(
        error,
        Entity.SCHOOL,
        school.clientUuid,
        Category.POSTGRES,
        {
          msg: 'Failed to insert school into database',
          props: { name: school.name },
        }
      );
    }
  }

  public static async findSchoolClientIdBySchoolName(
    orgId: ClientUuid,
    schoolName: string
  ): Promise<ClientUuid> {
    try {
      const id = await prisma.school.findFirst({
        where: {
          AND: [{ name: schoolName }, { clientOrgUuid: orgId }],
        },
        select: {
          clientUuid: true,
        },
      });
      if (!id) throw new Error(`School ${schoolName} was not found`);
      return id.clientUuid;
    } catch (error) {
      throw logError(error, Entity.SCHOOL, 'UNKNOWN', Category.POSTGRES, {
        msg: 'Failed to find school id in database',
        props: { name: schoolName },
      });
    }
  }

  public static async schoolNameExists(
    orgId: ClientUuid,
    schoolName: string
  ): Promise<boolean> {
    try {
      await SchoolRepo.findSchoolClientIdBySchoolName(orgId, schoolName);
      return true;
    } catch (_) {
      return false;
    }
  }

  public static async getSchoolIdsWithProgram(
    programId: Uuid,
    clientOrgUuid: ClientUuid
  ): Promise<ClientUuid[]> {
    try {
      const schools = await prisma.school.findMany({
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
      return schools.map((s) => s.clientUuid);
    } catch (error) {
      throw logError(error, Entity.SCHOOL, 'UNKNOWN', Category.POSTGRES, {
        msg: 'Failed to find schools with the given program ID',
        props: { programId: programId },
      });
    }
  }
}
