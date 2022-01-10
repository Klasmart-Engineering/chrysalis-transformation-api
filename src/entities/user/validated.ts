import { Prisma } from '@prisma/client';
import { validate, ClientUuid, Context } from '../../utils';
import { IUser, User } from '.';

export class ValidatedUser {
  private data: IUser;

  private constructor(user: IUser) {
    this.data = user;
  }

  get organizationName(): string {
    return this.data.OrganizationName;
  }

  get clientUuid(): ClientUuid {
    return this.data.UserUUID;
  }

  get givenName(): string {
    return this.data.UserGivenName;
  }

  get familyName(): string {
    return this.data.UserFamilyName;
  }

  get email(): string {
    return this.data.Email;
  }

  get phone(): string {
    return this.data.Phone;
  }

  get dateOfBirth(): string {
    return this.data.DateOfBirth;
  }

  get gender(): string {
    return this.data.Gender;
  }

  get kidsloopRoleName(): string[] {
    return this.data.KLRoleName;
  }

  get schoolName(): string {
    return this.data.SchoolName;
  }

  get classNames(): string[] {
    return this.data.ClassName;
  }

  get schoolRoleName(): string[] {
    return this.data.SchoolRoleName;
  }

  public static async validate(v: User): Promise<ValidatedUser> {
    const data = await validate<IUser, User, ValidatedUser>(v);
    return new ValidatedUser(data);
  }

  public async mapToDatabaseInput(): Promise<Prisma.UserCreateInput> {
    const ctx = await Context.getInstance();
    const orgId = await ctx.getOrganizationClientId(this.organizationName);
    const schoolId = await ctx.getSchoolClientId(orgId, this.schoolName);
    const classIds = await Promise.all(
      this.classNames.map(
        async (c) => await ctx.getClassClientId(orgId, schoolId, c)
      )
    );

    return {
      clientUuid: this.clientUuid,
      givenName: this.givenName,
      familyName: this.familyName,
      email: this.email,
      phone: this.phone,
      dateOfBirth: this.dateOfBirth,
      gender: this.gender,

      classUuids: { set: classIds },
      organization: { connect: { clientUuid: orgId } },
      school: { connect: { clientUuid: schoolId } },
    };
  }
}
