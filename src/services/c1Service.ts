import {BaseRestfulService} from './baseRestfulService';
import {C1Endpoints} from '../config/c1Endpoints';

export class C1Service extends BaseRestfulService {
  hostname = String(process.env.C1_API_HOSTNAME);
  jwtToken = '';
  refreshToken = '';

  constructor() {
    super();
    this.authenticate();
  }

  authenticate() {
    //TODO this should be implemented in CIL-61
  }

  tokenRefresh() {
    //TODO this should be implemented in CIL-62
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
