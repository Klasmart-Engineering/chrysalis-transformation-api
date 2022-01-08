import log from '../utils/logging';
import { userSchema } from '../validatorsSchemes';
import { prisma, Prisma } from '@prisma/client';
import { ClientUuid, Context } from '../utils/context';

export interface IUser {
  OrganizationName: string;
  UserUUID: string;
  UserGivenName: string;
  UserFamilyName: string;
  Email: string;
  Phone: string;
  DateOfBirth: string;
  Gender: string;
  KLRoleName: string[];
  SchoolName: string;
  ClassName: string[];
  SchoolRoleName: string[];
}

export class UserRepo {
  // public static async insertMany(
  //   classDetails: ValidatedClass[]
  // ): Promise<void> {
  //   try {
  //     await prisma.class.createMany({
  //       data: classDetails.map((c) => c.mapToDatabase()),
  //     });
  //   } catch (error) {
  //     log.error('Failed to insert classes into database', {
  //       error,
  //       classIds: classDetails.map((c) => c.data.ClassUUID),
  //     });
  //   }
  // }

  public static async insertOne(user: ValidatedUser): Promise<void> {
    try {
      await prisma.user.create({
        data: await user.mapToDatabaseInput(),
      });
    } catch (error) {
      log.error('Failed to insert class into database', {
        error,
        id: user.clientUuid,
      });
    }
  }
}

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

  public static async validate(u: IUser): Promise<ValidatedUser> {
    try {
      const { error, value } = userSchema.validate(u);
      if (error) throw error;
      const ctx = await Context.getInstance();
      // Make sure the organization name is valid
      const orgId = await ctx.getOrganizationClientId(u.OrganizationName);
      // Make sure the school name is valid
      const schoolId = await ctx.getSchoolClientId(orgId, u.SchoolName);

      // Make sure all the roles are valid
      ctx.rolesAreValid(u.KLRoleName);
      // Make sure all of the class names are valid
      await ctx.classesAreValid(u.ClassName, orgId, schoolId);

      return new ValidatedUser(value);
    } catch (error) {
      log.error(`User failed Validation`, {
        id: u.UserUUID,
        error,
      });
      throw new Error('Validation failed');
    }
  }

  public async mapToDatabaseInput(): Promise<Prisma.UserCreateInput> {
    const ctx = await Context.getInstance();
    const orgId = await ctx.getOrganizationClientId(this.organizationName);
    const schoolId = await ctx.getSchoolClientId(orgId, this.schoolName);
    const classIds = await Promise.all(
      this.classNames.map(async (c) => ctx.getClassClientId(orgId, schoolId, c))
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
