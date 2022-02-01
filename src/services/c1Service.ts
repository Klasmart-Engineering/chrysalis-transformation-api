import { BaseRestfulService } from './baseRestfulService';
import { C1AuthEndpoints, C1Endpoints } from '../config/c1Endpoints';
import { AuthServer } from '../utils/authServer';
import { ClassQuerySchema, OrganizationQuerySchema, SchoolQuerySchema, UserQuerySchema } from '../interfaces/clientSchemas';

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
  refreshToken = '';

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
            .catch((e) => {
              throw new Error('Failed to refresh token');
            });
        }, REFRESH_TOKEN_INTERVAL);
      })
      .catch((e) => {
        throw new Error('Failed to get access token');
      });
  }

  async getSchools(pathSegments: string[]): Promise<Array<SchoolQuerySchema>> {
    const client = this.createClient(
      C1Endpoints.organizationApiEndpoint,
      pathSegments
    );
    return await this.getData(client) as Array<SchoolQuerySchema>;
  }

  async getClasses(pathSegments: string[]): Promise<Array<ClassQuerySchema>> {
    const client = this.createClient(
      C1Endpoints.classesApiEndpoint,
      pathSegments
    );
    return await this.getData(client) as Array<ClassQuerySchema>;
  }

  async getUsers(
    pathSegments: string[], 
    queryParams: Record<string, string>
  ): Promise<Array<UserQuerySchema>> {
    const client = this.createClient(
      C1Endpoints.usersApiEndpoint,
      pathSegments,
      queryParams,
    );
    return await this.getData(client) as Array<UserQuerySchema>;
  }

  async getUser(
    pathSegments: string[],
    queryParams: Record<string, string>
  ): Promise<Array<UserQuerySchema>> {
    const client = this.createClient(
      C1Endpoints.userApiEndpoint,
      pathSegments,
      queryParams,
    );
    return await this.getData(client) as Array<UserQuerySchema>;
  }

  async getAllSchoolUsers(schoolUuid: string): Promise<Array<UserQuerySchema>> {
    const pageSize = process.env.PAGE_SIZE || 250;

    let allUsers: UserQuerySchema[] = []; 
    let start = 1;
    let users: UserQuerySchema[] = [];

    do {
      users = await this.getUsers(['SchoolGUID'], {Skip: start.toString(), Take: pageSize.toString(), ID: schoolUuid})
      allUsers = [
        ...allUsers,
        ...users,
      ];
      start += Number(pageSize);
    } while (users.length);

    return allUsers
  }

  async getOrganizations(): Promise<Array<OrganizationQuerySchema>> {
    const client = this.createClient(C1Endpoints.organizationApiEndpoint);
    const organizations = (await this.getData(
      client
    )) as Array<OrganizationQuerySchema>;

    return organizations;
  }
}
