import { BaseRestfulService } from './baseRestfulService';
import { C1AuthEndpoints, C1Endpoints } from '../config/c1Endpoints';
import { AuthServer } from '../utils/authServer';
import {
  ClassQuerySchema,
  FeedbackSchema,
  OrganizationQuerySchema,
  SchoolQuerySchema,
  UserQuerySchema,
  UsersQuerySchema,
} from '../interfaces/clientSchemas';
import { Methods } from './baseRestfulService';

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
  hostname = String(process.env.C1_API_HOSTNAME);
  jwtToken = '';

  constructor() {
    super();
    authServer
      .getAccessToken(C1AuthEndpoints.login)
      .then((res) => {
        this.jwtToken = res;
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
      })
      .catch(() => {
        throw new Error('Failed to get access token');
      });
  }

  async getSchools(pathSegments: string[]): Promise<Array<SchoolQuerySchema>> {
    const client = this.createClient(
      C1Endpoints.schoolsApiEndpoint,
      pathSegments
    );
    return (await this.getData(client)) as Array<SchoolQuerySchema>;
  }

  async getClasses(pathSegments: string[]): Promise<Array<ClassQuerySchema>> {
    const client = this.createClient(
      C1Endpoints.classesApiEndpoint,
      pathSegments
    );
    return (await this.getData(client)) as Array<ClassQuerySchema>;
  }

  async getUsers(
    pathSegments: string[],
    queryParams: Record<string, string>
  ): Promise<UsersQuerySchema> {
    const client = this.createClient(
      C1Endpoints.usersApiEndpoint,
      pathSegments,
      queryParams
    );
    return (await this.getData(client)) as UsersQuerySchema;
  }

  async getUser(
    pathSegments: string[],
    queryParams: Record<string, string>
  ): Promise<UsersQuerySchema> {
    const client = this.createClient(
      C1Endpoints.userApiEndpoint,
      pathSegments,
      queryParams
    );
    return (await this.getData(client)) as UsersQuerySchema;
  }

  async getAllSchoolUsers(schoolUuid: string): Promise<UserQuerySchema[]> {
    const pageSize = process.env.PAGE_SIZE || 250;

    const allUsers: UserQuerySchema[] = [];
    let start = 1;
    let users: UsersQuerySchema;

    do {
      users = await this.getUsers(['SchoolGUID'], {
        Skip: start.toString(),
        Take: pageSize.toString(),
        ID: schoolUuid,
      });
      if (!users.data) users.data = [];
      allUsers.push(...users.data);
      start += Number(pageSize);
    } while (users.data.length);

    return allUsers;
  }

  async getOrganizations(): Promise<Array<OrganizationQuerySchema>> {
    const client = this.createClient(C1Endpoints.organizationApiEndpoint);
    return (await this.getData(client)) as Array<OrganizationQuerySchema>;
  }

  async getSchool(pathSegments: string[]): Promise<SchoolQuerySchema> {
    const client = this.createClient(
      C1Endpoints.schoolApiEndpoint,
      pathSegments
    );
    return (await this.getData(client)) as SchoolQuerySchema;
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
