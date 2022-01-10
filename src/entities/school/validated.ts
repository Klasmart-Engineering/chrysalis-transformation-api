import { validate, ClientUuid, Context } from '../../utils';
import { Prisma } from '@prisma/client';
import { ISchool, School } from '.';

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
