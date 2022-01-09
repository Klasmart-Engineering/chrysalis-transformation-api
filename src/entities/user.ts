import { userSchema } from '../validatorsSchemes';
import { Prisma, PrismaClient } from '@prisma/client';
import { log, validate, Validator, ClientUuid, Context } from '../utils';
import { Entity } from '.';
import { Api } from '../api/c1Api';

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

export class UserToBeValidated implements Validator<IUser, ValidatedUser> {
  public readonly schema = userSchema;
  public readonly entity = Entity.USER;

  private constructor(public readonly data: IUser) {}

  public getEntityId(): string {
    return this.data.UserUUID;
  }

  public async validate(): Promise<ValidatedUser> {
    return await ValidatedUser.validate(this);
  }

  public getOrganizationName(): string {
    return this.data.OrganizationName;
  }

  public getSchoolName(): string {
    return this.data.SchoolName;
  }

  public getRoles(): string[] {
    return this.data.KLRoleName;
  }

  public getClasses(): string[] {
    return this.data.ClassName;
  }

  public static async fetchAllForSchool(
    schoolId: ClientUuid
  ): Promise<UserToBeValidated[]> {
    const api = await Api.getInstance();
    const users = await api.getUsersBySchool(schoolId);
    return users.map((u) => new UserToBeValidated(u));
  }

  public static async fetchAllForClass(
    classId: ClientUuid
  ): Promise<UserToBeValidated[]> {
    const api = await Api.getInstance();
    const users = await api.getUsersByClass(classId);
    return users.map((u) => new UserToBeValidated(u));
  }

  public static async fetch(id: ClientUuid): Promise<UserToBeValidated> {
    const api = await Api.getInstance();
    const u = await api.getUser(id);
    return new UserToBeValidated(u);
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

  public static async validate(v: UserToBeValidated): Promise<ValidatedUser> {
    const data = await validate<IUser, UserToBeValidated, ValidatedUser>(v);
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
