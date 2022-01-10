import { ClassRepo, Entity, SchoolRepo } from '../';
import { log } from '../../utils';
import { RawProgram } from './rawProgram';
import { ProgramName, OrganizationId, Program } from '.';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProgramRepo {
  public static async insertOne(program: RawProgram): Promise<void> {
    try {
      await prisma.program.create({
        data: await program.mapToDatabaseInput(),
      });
    } catch (error) {
      log.error('Failed to insert program into database', {
        error,
        id: program.kidsloopUuid,
        name: program.name,
        entity: Entity.PROGRAM,
      });
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
      if (!program)
        throw new Error(
          `Program ${programName} not found for Organization ${org}`
        );
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
      let logLevel = 'error';
      if (
        error instanceof Error &&
        error.message.startsWith(`Program ${programName}`)
      ) {
        logLevel = 'warn';
      }
      log.log(
        logLevel,
        'Failed to find program in database when searching with organisation id',
        {
          error,
          programName,
          organisationId: org,
          entity: Entity.PROGRAM,
        }
      );
      throw error;
    }
  }
}
