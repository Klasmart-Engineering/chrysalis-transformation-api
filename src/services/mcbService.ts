import {BaseRestfulService} from './baseRestfulService';
import {McbEndpoints} from '../config/mcbEnpoints';

export class McbService extends BaseRestfulService {
  hostname = String(process.env.MCB_API_HOSTNAME);
  jwtToken = String(process.env.MCB_API_TOKEN);

  getSchools(params: Record<string, string>) {
    const client = this.createClient(McbEndpoints.schoolApiEndpoint, [], params);
    return this.getData(client);
  }

  getClasses() {
    const client = this.createClient(McbEndpoints.classApiEndpoint);
    return this.getData(client);
  }

  getStudents() {
    const client = this.createClient(McbEndpoints.studentApiEndpoint);
    return this.getData(client);
  }

  getStaff() {
    const client = this.createClient(McbEndpoints.staffApiEndpoint);
    return this.getData(client);
  }
}
