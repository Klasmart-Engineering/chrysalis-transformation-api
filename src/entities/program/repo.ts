import { ClassRepo, Entity, SchoolRepo } from '../';
import {
  Category,
  log,
  logError,
  OrganizationId,
  ProgramName,
} from '../../utils';
import { RawProgram } from './rawProgram';
import { Program } from '.';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProgramRepo {
  public static async insertOne(program: RawProgram): Promise<void> {
    try {
      await prisma.program.create({
        data: await program.mapToDatabaseInput(),
      });
    } catch (error) {
      throw logError(
        error,
        Entity.PROGRAM,
        program.kidsloopUuid,
        Category.POSTGRES,
        {
          msg: 'Failed to insert program into database',
          props: { name: program.name },
        }
      );
    }
  }

  public static async findProgramByNameForOrganization(
    programName: ProgramName,
    org: OrganizationId
  ): Promise<Program> {
    try {
      const program = await prisma.program.findFirst({
        where: {
          AND: [{ name: programName }, { clientOrgUuid: org }],
        },
        select: {
          klUuid: true,
          name: true,
          clientOrgUuid: true,
        },
      });
      if (!program) throw new Error('Program not found');
      const schools = await SchoolRepo.getSchoolIdsWithProgram(
        program.klUuid,
        program.clientOrgUuid!
      );
      const classes = await ClassRepo.getClassIdsWithProgram(
        program.klUuid,
        program.clientOrgUuid!
      );
      return new Program(
        program.klUuid,
        program.name,
        program.clientOrgUuid!,
        classes,
        schools
      );
    } catch (error) {
      if (error instanceof Error && error.message === `Program not found`) {
        log.warn(
          'Failed to find program in database when searching with organisation id',
          {
            error,
            programName,
            organisationId: org,
            entity: Entity.PROGRAM,
          }
        );
        throw error;
      } else {
        throw logError(error, Entity.PROGRAM, 'UNKNOWN', Category.POSTGRES, {
          msg: `Program ${programName} not found for Organization ${org}`,
          props: { name: programName },
        });
      }
    }
  }
}
