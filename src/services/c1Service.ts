import { BaseRestfulService, Methods } from './baseRestfulService';
import { C1AuthEndpoints, C1Endpoints } from '../config/c1Endpoints';
import { AuthServer } from '../utils/authServer';
import {
  ClassQuerySchema,
  Feedback,
  FeedbackResponse,
  OrganizationQuerySchema,
  SchoolQuerySchema,
  UserQuerySchema,
} from '../interfaces/clientSchemas';
import logger from '../utils/logging';
import { stringify } from '../utils/stringify';

const loginData = JSON.stringify({
  Username: String(process.env.C1_API_USERNAME),
  Password: String(process.env.C1_API_PASSWORD),
});

const REFRESH_TOKEN_INTERVAL = 600000;

const authServer = new AuthServer(
  String(process.env.C1_API_HOSTNAME),
  loginData,
  process.env.C1_API_PORT
);

export class C1Service extends BaseRestfulService {
  private static _instance: C1Service;
  hostname = String(process.env.C1_API_HOSTNAME);
  port = process.env.C1_API_PORT;
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
          logger.error('Failed to refresh token');
        });
    }, REFRESH_TOKEN_INTERVAL);
  }

  public static async getInstance() {
    if (this._instance) return this._instance;
    const token = await authServer.getAccessToken(C1AuthEndpoints.login);
    this._instance = new C1Service(token);
    return this._instance;
  }

  async getOrganizations(): Promise<Array<OrganizationQuerySchema>> {
    const client = this.createClient(C1Endpoints.organizationApiEndpoint);
    let organizations: OrganizationQuerySchema[] = [];
    
    try {
      organizations = (await this.getData(client)) as Array<OrganizationQuerySchema>;
    }
    catch (error) {
      const stringifyError = stringify(error);
      logger.error(stringifyError);
    }

    return organizations ?? [];
  }

  async getOrgSchools(
    pathSegments: string[]
  ): Promise<Array<SchoolQuerySchema>> {
    const client = this.createClient(
      C1Endpoints.organizationApiEndpoint,
      pathSegments
    );
    return (await this.getData(client)) as Array<SchoolQuerySchema>;
  }

  async getSchools(): Promise<Array<SchoolQuerySchema>> {
    const client = this.createClient(C1Endpoints.schoolsApiEndpoint);
    let schools: SchoolQuerySchema[] = [];
    
    try {
      schools = (await this.getData(client)) as SchoolQuerySchema[];   
    } catch (error) {
      const stringifyError = stringify(error);
      logger.error(stringifyError);
    }

    return schools ?? [];
  }

  async getClasses(): Promise<Array<ClassQuerySchema>> {
    const client = this.createClient(C1Endpoints.classesApiEndpoint);
    let classes: ClassQuerySchema[] = [];

    try {
      classes = (await this.getData(client)) as ClassQuerySchema[];
    } catch (error) {
      const stringifyError = stringify(error);
      logger.error(stringifyError);
    }

    return classes ?? []; 
  }

  async getUsers(): Promise<Array<UserQuerySchema>> {
    const client = this.createClient(C1Endpoints.usersApiEndpoint);
    let users: UserQuerySchema[] = [];

    try {
      users = (await this.getData(client)) as UserQuerySchema[];
    } catch (error) {
      const stringifyError = stringify(error);
      logger.error(stringifyError);
    }

    return users ?? []; 
  }

  async postFeedback(feedback: Feedback[]): Promise<Array<FeedbackResponse>> {
    const postData = JSON.stringify(feedback);
    const client = this.createClient(
      C1Endpoints.feedbackApiEndpoint,
      [],
      undefined,
      Methods.post,
      postData.length
    );

    return (await this.getData(client, postData)) as FeedbackResponse[];
  }
}
