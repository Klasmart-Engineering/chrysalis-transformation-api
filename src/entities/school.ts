import { log, validate, Validator, ClientUuid, Context } from '../utils';
import { schoolSchema } from '../validatorsSchemes';
import { Prisma, PrismaClient } from '@prisma/client';
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

export class SchoolToBeValidated implements Validator<ISchool> {
  public schema = schoolSchema;
  public entity = Entity.SCHOOL;

  constructor(public data: ISchool) {}

  getEntityId(): string {
    return this.data.SchoolUUID;
  }
  getOrganizationName(): string {
    return this.data.OrganizationName;
  }
  getSchoolName(): string {
    return this.data.SchoolName;
  }
  getPrograms(): string[] {
    return this.data.ProgramName;
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
    const v = new SchoolToBeValidated(s);
    const data = await validate<ISchool, SchoolToBeValidated>(v);
    return new ValidatedSchool(data);
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
