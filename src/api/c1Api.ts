import { C1Endpoints } from '../config/c1Endpoints';
import { Entity } from '../entities';
import { IClass } from '../entities/class';
import { IOrganization } from '../entities/organization';
import { ISchool } from '../entities/school';
import { IUser } from '../entities/user';
import { ClientUuid, HttpClient } from '../utils';
import { InvalidEntityNameError } from '../utils/errors';
import { Feedback } from '../utils/feedback';

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

  public async getOrganization(id: ClientUuid): Promise<IOrganization> {
    const orgs = await this.getAllOrganizations();
    const org = orgs.find((o) => o.OrganizationUUID === id);
    if (!org)
      throw new InvalidEntityNameError(Entity.ORGANIZATION, '', undefined, id);
    return org;
  }

  public async getSchoolsByOrganizationId(id: ClientUuid): Promise<ISchool[]> {
    const { data } = await this.client.get<ISchool[]>(
      `${C1Endpoints.organization}/${id}`
    );
    return data;
  }

  public async getSchool(id: ClientUuid): Promise<ISchool> {
    const { data } = await this.client.get<ISchool>(
      `${C1Endpoints.school}/${id}`
    );
    return data;
  }

  public async getClassesBySchool(id: ClientUuid): Promise<IClass[]> {
    const { data } = await this.client.get<IClass[]>(
      `${C1Endpoints.classes}/${id}`
    );
    return data;
  }

  public async getClass(id: ClientUuid): Promise<IClass> {
    const { data } = await this.client.get<IClass>(
      `${C1Endpoints.singleClass}/${id}`
    );
    return data;
  }

  public async getUsersByClass(classId: ClientUuid): Promise<IUser[]> {
    const { data } = await this.client.get<IUser[]>(
      `${C1Endpoints.users}/${classId}`
    );
    return data;
  }

  public async getUser(id: ClientUuid): Promise<IUser> {
    const { data } = await this.client.get<IUser>(`${C1Endpoints.user}/${id}`);
    return data;
  }

  public async getUsersBySchool(schoolId: ClientUuid): Promise<IUser[]> {
    const { data } = await this.client.get<IUser[]>(
      `${C1Endpoints.users}/${schoolId}/School`
    );
    return data;
  }

  public async postFeedback(payload: Feedback): Promise<void> {
    await this.client.post(C1Endpoints.feedback, payload);
  }
}
