import log from '../utils/logging';
import { userSchema } from '../validatorsSchemes';
import { Prisma, PrismaClient } from '@prisma/client';
import { Context } from '../utils/context';
import { ClientUuid } from '../utils';
import { Validator, validate } from '../utils/validations';
import { Entity } from '.';

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

const prisma = new PrismaClient();

export class UserRepo {
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

export class UserToBeValidated implements Validator<IUser> {
  public schema = userSchema;
  public entity = Entity.USER;

  constructor(public data: IUser) {}

  getEntityId(): string {
    return this.data.UserUUID;
  }

  getOrganizationName(): string {
    return this.data.OrganizationName;
  }
  getSchoolName(): string {
    return this.data.SchoolName;
  }
  getRoles(): string[] {
    return this.data.KLRoleName;
  }
  getClasses(): string[] {
    return this.data.ClassName;
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
    const v = new UserToBeValidated(u);
    const data = await validate<IUser, UserToBeValidated>(v);
    return new ValidatedUser(data);
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
