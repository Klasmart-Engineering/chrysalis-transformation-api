import {BaseRestfulService} from './baseRestfulService';
import {C1AuthEndpoints, C1Endpoints} from '../config/c1Endpoints';
import {AuthServer} from '../utils/authServer';

const loginData = JSON.stringify({
  'Username': String(process.env.C1_API_USERNAME),
  'Password': String(process.env.C1_API_PASSWORD)
});

const authServer = new AuthServer(String(process.env.C1_API_HOSTNAME), loginData);

export class C1Service extends BaseRestfulService {
  hostname = String(process.env.C1_API_HOSTNAME);
  jwtToken = '';
  refreshToken = '';

  constructor() {
    super();
    authServer.getAccessToken(C1AuthEndpoints.login)
      .then(res => this.jwtToken = res)
      .catch(() => { throw new Error('error to get access token') });
  }

  getSchools(pathSegments: string[]) {
    const client = this.createClient(C1Endpoints.schoolApiEndpoint, pathSegments);
    return this.getData(client);
  }

  getClasses() {
    const client = this.createClient(C1Endpoints.classApiEndpoint);
    return this.getData(client);
  }

  getUsers() {
    const client = this.createClient(C1Endpoints.userApiEndpoint);
    return this.getData(client);
  }
}
