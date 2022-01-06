import { C1Endpoints } from '../config/c1Endpoints';
import { IClass } from '../entities/class';
import { IOrganization } from '../entities/organization';
import { ISchool } from '../entities/school';
import { IUser } from '../entities/user';
import { HttpClient } from '../utils';

export class Api {
  private static _instance: Api;

  private constructor(private client: HttpClient) {}

  public static async getInstance(): Promise<Api> {
    if (this._instance) return this._instance;
    const client = await HttpClient.initialize(
      process.env.C1_API_HOSTNAME || ''
    );
    const api = new Api(client);
    this._instance = api;
    return this._instance;
  }

  public async getAllOrganizations(): Promise<IOrganization[]> {
    const { data } = await this.client.get<IOrganization[]>(
      C1Endpoints.organization
    );
    return data;
  }

  public async getSchoolsByOrganizationId(id: string): Promise<ISchool[]> {
    const { data } = await this.client.get<ISchool[]>(
      `${C1Endpoints.organization}/${id}`
    );
    return data;
  }

  public async getSchool(id: string): Promise<ISchool> {
    const { data } = await this.client.get<ISchool>(
      `${C1Endpoints.school}/${id}`
    );
    return data;
  }

  public async getClassesBySchool(id: string): Promise<IClass[]> {
    const { data } = await this.client.get<IClass[]>(
      `${C1Endpoints.classes}/${id}`
    );
    return data;
  }

  public async getClass(id: string): Promise<IClass> {
    const { data } = await this.client.get<IClass>(
      `${C1Endpoints.singleClass}/${id}`
    );
    return data;
  }

  public async getUsersByClass(id: string): Promise<IUser[]> {
    const { data } = await this.client.get<IUser[]>(
      `${C1Endpoints.users}/${id}`
    );
    return data;
  }

  public async getUser(id: string): Promise<IUser> {
    const { data } = await this.client.get<IUser>(`${C1Endpoints.user}/${id}`);
    return data;
  }

  public async getUsersBySchool(id: string): Promise<IUser[]> {
    const { data } = await this.client.get<IUser[]>(
      `${C1Endpoints.users}/${id}/School`
    );
    return data;
  }
}
