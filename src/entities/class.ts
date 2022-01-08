import { PrismaClient, Prisma } from '@prisma/client';
import { Entity } from '.';
import { ClientUuid } from '../utils';
import { Context } from '../utils/context';
import { logError } from '../utils/errors';

import log from '../utils/logging';
import { validate, Validator } from '../utils/validations';
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
      });
      throw error;
    }
  }
}

export class ClassToBeValidated implements Validator<IClass> {
  public schema = classSchema;
  public entity = Entity.CLASS;

  constructor(public data: IClass) {}

  getEntityId(): string {
    return this.data.ClassUUID;
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

  public static async validate(c: IClass): Promise<ValidatedClass> {
    const v = new ClassToBeValidated(c);
    const data = await validate<IClass, ClassToBeValidated>(v);
    return new ValidatedClass(data);
  }

  public async mapToDatabaseInput(): Promise<Prisma.ClassCreateInput> {
    const ctx = await Context.getInstance();
    const orgId = await ctx.getOrganizationClientId(this.organizationName);
    const schoolId = await ctx.getSchoolClientId(orgId, this.schoolName);
    const programIds = this.programNames.map((p) => ctx.getProgramIdByName(p));

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
