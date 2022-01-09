import {
  log,
  validate,
  Validator,
  ClientUuid,
  Context,
  ProcessChain,
} from '../utils';
import { schoolSchema } from '../validatorsSchemes';
import { Prisma, PrismaClient } from '@prisma/client';
import { Entity } from '.';
import { Api } from '../api/c1Api';

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
        entity: Entity.SCHOOL,
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
        entity: Entity.SCHOOL,
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

export class School implements ProcessChain<ISchool, ValidatedSchool> {
  public readonly schema = schoolSchema;
  public readonly entity = Entity.SCHOOL;

  private constructor(public readonly data: ISchool) {}

  public getEntityId(): string {
    return this.data.SchoolUUID;
  }

  public async validate(): Promise<ValidatedSchool> {
    return await ValidatedSchool.validate(this);
  }

  public async insertOne(item: ValidatedSchool): Promise<void> {
    await SchoolRepo.insertOne(item);
  }

  public async process(): Promise<ValidatedSchool> {
    const school = await this.validate();
    await this.insertOne(school);
    return school;
  }

  public getOrganizationName(): string {
    return this.data.OrganizationName;
  }

  public getPrograms(): string[] {
    return this.data.ProgramName;
  }

  public static async fetchAllForOrganization(
    orgId: ClientUuid
  ): Promise<School[]> {
    const api = await Api.getInstance();
    const schools = await api.getSchoolsByOrganizationId(orgId);
    return schools.map((s) => new School(s));
  }

  public static async fetch(id: ClientUuid): Promise<School> {
    const api = await Api.getInstance();
    const school = await api.getSchool(id);
    return new School(school);
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
  public static async validate(v: School): Promise<ValidatedSchool> {
    const data = await validate<ISchool, School, ValidatedSchool>(v);
    return new ValidatedSchool(data);
  }

  /**
   * Maps the data held internally into a format required for a database
   * create object
   */
  public async mapToDatabaseInput(): Promise<Prisma.SchoolCreateInput> {
    const ctx = await Context.getInstance();
    const orgId = await ctx.getOrganizationClientId(this.organizationName);
    const programIds = await Promise.all(
      this.programNames.map(async (p) => await ctx.getProgramIdByName(p, orgId))
    );

    return {
      clientUuid: this.clientUuid,
      name: this.name,
      shortCode: this.shortCode,
      programUuids: { set: programIds },
      organization: { connect: { clientUuid: orgId } },
    };
  }
}
