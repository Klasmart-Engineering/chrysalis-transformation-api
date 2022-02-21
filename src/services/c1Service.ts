import { BaseRestfulService, Methods } from './baseRestfulService';
import { C1AuthEndpoints, C1Endpoints } from '../config/c1Endpoints';
import { AuthServer } from '../utils/authServer';
import {
  ClassQuerySchema,
  FeedbackSchema,
  OrganizationQuerySchema,
  SchoolQuerySchema,
  UserQuerySchema,
} from '../interfaces/clientSchemas';

const loginData = JSON.stringify({
  Username: String(process.env.C1_API_USERNAME),
  Password: String(process.env.C1_API_PASSWORD),
});

const REFRESH_TOKEN_INTERVAL = 600000;

const authServer = new AuthServer(
  String(process.env.C1_API_HOSTNAME),
  loginData
);

export class C1Service extends BaseRestfulService {
  private static _instance: C1Service;
  hostname = String(process.env.C1_API_HOSTNAME);
  jwtToken = '';

  constructor(jwtToken: string) {
    super();
    this.jwtToken = jwtToken;
    setInterval(() => {
      authServer
        .doRefreshToken(C1AuthEndpoints.refresh)
        .then((response) => {
          this.jwtToken = response;
        })
        .catch(() => {
          throw new Error('Failed to refresh token');
        });
    }, REFRESH_TOKEN_INTERVAL);
  }

  public static async getInstance() {
    if (this._instance) return this._instance;
    const token = await authServer
      .getAccessToken(C1AuthEndpoints.login);
    this._instance = new C1Service(token);
    return this._instance;
  }

  async getOrganizations(): Promise<Array<OrganizationQuerySchema>> {
    const client = this.createClient(C1Endpoints.organizationApiEndpoint);
    return (await this.getData(client)) as Array<OrganizationQuerySchema>;
  }

  async getOrgSchools(pathSegments: string[]): Promise<Array<SchoolQuerySchema>> {
    const client = this.createClient(
      C1Endpoints.organizationApiEndpoint,
      pathSegments
    );
    return (await this.getData(client)) as Array<SchoolQuerySchema>;
  }

  async getSchools(): Promise<Array<SchoolQuerySchema>> {
    const client = this.createClient(C1Endpoints.schoolsApiEndpoint);
    return (await this.getData(client)) as SchoolQuerySchema[];
  }

  async getClasses(): Promise<Array<ClassQuerySchema>> {
    const client = this.createClient(C1Endpoints.classesApiEndpoint);
    return (await this.getData(client)) as ClassQuerySchema[];
  }

  async getUsers(): Promise<Array<UserQuerySchema>> {
    const client = this.createClient(C1Endpoints.usersApiEndpoint);
    return (await this.getData(client)) as UserQuerySchema[];
  }


  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async postFeedback(data: Record<string, any>[]): Promise<FeedbackSchema> {
    const postData = JSON.stringify(data);
    const client = this.createClient(
      C1Endpoints.feedbackApiEndpoint,
      [],
      undefined,
      Methods.post,
      postData.length
    );

    return (await this.getData(client, postData)) as FeedbackSchema;
  }
}
