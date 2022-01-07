import log from '../utils/logging';
import { schoolSchema } from '../validatorsSchemes';
import { Prisma, PrismaClient, School } from '@prisma/client';
import { Context } from '../utils/context';
import { ClientUuid } from '../utils';
import { logError, ValidationError } from '../utils/errors';
import { Entity } from '.';

export interface ISchool {
  OrganizationName: string;
  SchoolUUID: string;
  SchoolName: string;
  SchoolShortCode: string;
  ProgramName: string[];
  Source: string;
}

const prisma = new PrismaClient();

export class SchoolRepo {
  /*
   * @TODO - Looks like you can't built insert and create relations at the same
   * time
  public static async insertMany(schools: ValidatedSchool[]): Promise<void> {
    try {
      await prisma.school.createMany({
        data: schools.map((s) => await s.mapToDatabaseInput()),
      });
    } catch (error) {
      log.error('Failed to insert schools into database', {
        error,
        schoolIds: schools.map((s) => s.data.SchoolUUID),
      });
    }
  }
  */

  public static async insertOne(school: ValidatedSchool): Promise<void> {
    try {
      await prisma.school.create({
        data: await school.mapToDatabaseInput(),
      });
    } catch (error) {
      log.error('Failed to insert school into database', {
        error,
        id: school.clientUuid,
        name: school.name,
      });
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
      log.error('Failed to find school id in database', {
        error,
        name: schoolName,
        organizationId: orgId,
      });
      throw error;
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
}

export class ValidatedSchool {
  private data: ISchool;

  private constructor(school: ISchool) {
    this.data = school;
  }

  get name(): string {
    return this.data.SchoolName;
  }

  get clientUuid(): ClientUuid {
    return this.data.SchoolUUID;
  }

  get organizationName(): string {
    return this.data.OrganizationName;
  }

  get shortCode(): string {
    return this.data.SchoolShortCode;
  }

  get programNames(): string[] {
    return this.data.ProgramName;
  }

  /**
   * @param {ISchool} org - The school data to be validated
   * @returns {ValidatedSchool} A validated school
   * @throws If the school is invalid
   */
  public static async validate(s: ISchool): Promise<ValidatedSchool> {
    try {
      const { error, value } = schoolSchema.validate(s);
      if (error)
        throw ValidationError.fromJoiError(error, Entity.SCHOOL, s.SchoolUUID);
      const ctx = await Context.getInstance();
      // Make sure the organization name is valid
      await ctx.getOrganizationClientId(s.OrganizationName);
      // Make sure all the program names are valid
      ctx.programsAreValid(s.ProgramName);

      return new ValidatedSchool(value);
    } catch (error) {
      logError(error, Entity.SCHOOL);
    }
    throw new Error('Unreachable');
  }

  /**
   * Maps the data held internally into a format required for a database
   * create object
   */
  public async mapToDatabaseInput(): Promise<Prisma.SchoolCreateInput> {
    const ctx = await Context.getInstance();
    const orgId = await ctx.getOrganizationClientId(this.organizationName);
    const programIds = this.programNames.map((p) => ctx.getProgramIdByName(p));

    return {
      clientUuid: this.clientUuid,
      name: this.name,
      shortCode: this.shortCode,
      programUuids: { set: programIds },
      organization: { connect: { clientUuid: orgId } },
    };
  }
}
