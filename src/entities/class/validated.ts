import { Prisma } from '@prisma/client';
import {
  validate,
  ClientUuid,
  Context
} from '../../utils';
import { IClass, Class } from '.';

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

  public static async validate(v: Class): Promise<ValidatedClass> {
    const data = await validate<IClass, Class, ValidatedClass>(v);
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
