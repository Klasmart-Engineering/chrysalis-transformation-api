import { PrismaClient, Prisma } from '@prisma/client';
import { Entity } from '.';
import { Api } from '../api/c1Api';
import { log, validate, Validator, ClientUuid, Context } from '../utils';
import { classSchema } from '../validatorsSchemes';

export interface IClass {
  OrganizationName: string;
  ClassUUID: string;
  ClassName: string;
  ClassShortCode: string;
  ProgramName: string[];
  SchoolName: string;
}

const prisma = new PrismaClient();

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
}

export class ClassToBeValidated implements Validator<IClass, ValidatedClass> {
  public readonly schema = classSchema;
  public readonly entity = Entity.CLASS;

  private constructor(public readonly data: IClass) {}

  public getEntityId(): string {
    return this.data.ClassUUID;
  }

  public async validate(): Promise<ValidatedClass> {
    return await ValidatedClass.validate(this);
  }

  public getOrganizationName(): string {
    return this.data.OrganizationName;
  }

  public getSchoolName(): string {
    return this.data.SchoolName;
  }

  public getPrograms(): string[] {
    return this.data.ProgramName;
  }

  public static async fetchAllForSchool(
    schoolId: ClientUuid
  ): Promise<ClassToBeValidated[]> {
    const api = await Api.getInstance();
    const classes = await api.getClassesBySchool(schoolId);
    return classes.map((c) => new ClassToBeValidated(c));
  }

  public static async fetch(id: ClientUuid): Promise<ClassToBeValidated> {
    const api = await Api.getInstance();
    const c = await api.getClass(id);
    return new ClassToBeValidated(c);
  }
}

export class ValidatedClass {
  private data: IClass;

  private constructor(classDetails: IClass) {
    this.data = classDetails;
  }

  get name(): string {
    return this.data.ClassName;
  }

  get clientUuid(): ClientUuid {
    return this.data.ClassUUID;
  }

  get organizationName(): string {
    return this.data.OrganizationName;
  }

  get schoolName(): string {
    return this.data.SchoolName;
  }

  get shortCode(): string {
    return this.data.ClassShortCode;
  }

  get programNames(): string[] {
    return this.data.ProgramName;
  }

  public static async validate(v: ClassToBeValidated): Promise<ValidatedClass> {
    const data = await validate<IClass, ClassToBeValidated, ValidatedClass>(v);
    return new ValidatedClass(data);
  }

  public async mapToDatabaseInput(): Promise<Prisma.ClassCreateInput> {
    const ctx = await Context.getInstance();
    const orgId = await ctx.getOrganizationClientId(this.organizationName);
    const schoolId = await ctx.getSchoolClientId(orgId, this.schoolName);
    const programIds = await Promise.all(
      this.programNames.map(async (p) => await ctx.getProgramIdByName(p, orgId))
    );

    return {
      clientUuid: this.clientUuid,
      name: this.name,
      shortCode: this.shortCode,
      programUuids: { set: programIds },
      organization: { connect: { clientUuid: orgId } },
      school: { connect: { clientUuid: schoolId } },
    };
  }
}
