import { userSchema } from '../../validatorsSchemes';
import { ClientUuid, ProcessChain } from '../../utils';
import { Entity } from '..';
import { Api } from '../../api/c1Api';
import { UserRepo } from './repo';
import { ValidatedUser } from './validated';

export { UserRepo } from './repo';
export { ValidatedUser } from './validated';

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

export class User implements ProcessChain<IUser, ValidatedUser> {
  public readonly schema = userSchema;
  public readonly entity = Entity.USER;

  private constructor(public readonly data: IUser) {}

  public getEntityId(): string {
    return this.data.UserUUID;
  }

  public async validate(): Promise<ValidatedUser> {
    return await ValidatedUser.validate(this);
  }

  public async insertOne(item: ValidatedUser): Promise<void> {
    await UserRepo.insertOne(item);
  }

  public async process(): Promise<ValidatedUser> {
    const user = await this.validate();
    await this.insertOne(user);
    return user;
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

  public static async fetchAllForSchool(schoolId: ClientUuid): Promise<User[]> {
    const api = await Api.getInstance();
    const users = await api.getUsersBySchool(schoolId);
    return users.map((u) => new User(u));
  }

  public static async fetchAllForClass(classId: ClientUuid): Promise<User[]> {
    const api = await Api.getInstance();
    const users = await api.getUsersByClass(classId);
    return users.map((u) => new User(u));
  }

  public static async fetch(id: ClientUuid): Promise<User> {
    const api = await Api.getInstance();
    const u = await api.getUser(id);
    return new User(u);
  }
}
