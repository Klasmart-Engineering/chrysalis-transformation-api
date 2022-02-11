import { BaseRestfulService, Methods } from './baseRestfulService';
import { C1AuthEndpoints, C1Endpoints } from '../config/c1Endpoints';
import { AuthServer } from '../utils/authServer';
import {
  ClassesQuerySchema,
  ClassQuerySchema,
  FeedbackSchema,
  OrganizationQuerySchema,
  SchoolQuerySchema,
  SchoolsQuerySchema,
  UserQuerySchema,
  UsersQuerySchema,
} from '../interfaces/clientSchemas';

const loginData = JSON.stringify({
  Username: String(process.env.C1_API_USERNAME),
  Password: String(process.env.C1_API_PASSWORD),
});

const REFRESH_TOKEN_INTERVAL = 600000;
const pageSize = process.env.PAGE_SIZE || 250;

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

  async getSchool(pathSegments: string[]): Promise<SchoolQuerySchema> {
    const client = this.createClient(
      C1Endpoints.schoolApiEndpoint,
      pathSegments
    );
    return (await this.getData(client)) as SchoolQuerySchema;
  }

  async getOrgSchools(pathSegments: string[]): Promise<Array<SchoolQuerySchema>> {
    const client = this.createClient(
      C1Endpoints.organizationApiEndpoint,
      pathSegments
    );
    return (await this.getData(client)) as Array<SchoolQuerySchema>;
  }

  private async getSchools(
    pathSegments: string[],
    queryParams: Record<string, string>
  ): Promise<SchoolsQuerySchema> {
    const client = this.createClient(
      C1Endpoints.schoolsApiEndpoint,
      pathSegments,
      queryParams
    );
    return (await this.getData(client)) as SchoolsQuerySchema;
  }

  async getAllSchools(): Promise<Array<SchoolQuerySchema>> {
    const allSchools: SchoolQuerySchema[] = [];
    let start = 1;
    let schools: SchoolsQuerySchema;

    do {
      schools = await this.getSchools([], {
        Skip: start.toString(),
        Take: pageSize.toString(),
      });
      if (!schools.data) schools.data = [];
      allSchools.push(...schools.data);
      start += Number(pageSize);
    } while (schools.data.length);

    return allSchools;
  }

  async getSchoolClasses(
    pathSegments: string[]
  ): Promise<Array<ClassQuerySchema>> {
    const client = this.createClient(
      C1Endpoints.classesApiEndpoint,
      pathSegments
    );
    return (await this.getData(client)) as Array<ClassQuerySchema>;
  }

  private async getClasses(
    pathSegments: string[],
    queryParams: Record<string, string>
  ): Promise<ClassesQuerySchema> {
    const client = this.createClient(
      C1Endpoints.classesApiEndpoint,
      pathSegments,
      queryParams
    );
    return (await this.getData(client)) as ClassesQuerySchema;
  }

  async getAllClasses(): Promise<Array<ClassQuerySchema>> {
    const allClasses: ClassQuerySchema[] = [];
    let start = 1;
    let classes: ClassesQuerySchema;

    do {
      classes = await this.getClasses([], {
        Skip: start.toString(),
        Take: pageSize.toString(),
      });
      if (!classes.data) classes.data = [];
      allClasses.push(...classes.data);
      start += Number(pageSize);
    } while (classes.data.length);

    return allClasses;
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

  private async getUsers(
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

  async getAllSchoolUsers(schoolUuid: string): Promise<UserQuerySchema[]> {
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

  async getAllUsers(): Promise<UserQuerySchema[]> {
    const allUsers: UserQuerySchema[] = [];
    let start = 1;
    let users: UsersQuerySchema;

    do {
      users = await this.getUsers([], {
        Skip: start.toString(),
        Take: pageSize.toString(),
      });
      if (!users.data) users.data = [];
      allUsers.push(...users.data);
      start += Number(pageSize);
    } while (users.data.length);

    return allUsers;
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
