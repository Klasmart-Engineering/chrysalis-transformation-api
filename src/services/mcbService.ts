import https from "https";
import {HttpError} from '../utils';
import {BaseRestfulService} from '../interfaces/baseRestfulService';
import {HttpOptions} from '../interfaces/httpOptions';
import {stringify} from 'query-string';

enum Endpoints {
  schoolApiEndpoint = `/api/KidsLoop/Get_SchoolsList`,
  classApiEndpoint = `/api/KidsLoop/Get_ClassesList`,
  studentApiEndpoint = `/api/KidsLoop/Get_StudentsList`,
  staffApiEndpoint = `/api/KidsLoop/Get_StaffList`
}

export class McbService implements BaseRestfulService {
  hostname = String(process.env.MCB_API_HOSTNAME);
  schoolApiEndpoint = Endpoints.schoolApiEndpoint;
  classApiEndpoint = Endpoints.classApiEndpoint;
  studentApiEndpoint = Endpoints.studentApiEndpoint;
  staffApiEndpoint = Endpoints.staffApiEndpoint;

  createClient(path: Endpoints, queryParams?: Record<string, unknown>): HttpOptions {
    return {
      hostname: this.hostname,
      path: queryParams ? path + '?' + stringify(queryParams) : path,
      method: 'GET',
      headers: {
        //Bearer Authorization token for authorize through MCB Api endpoint
        'Authorization': String(process.env.MCB_API_TOKEN),
        'Content-Type': 'application/json'
      }
    }
  }

  getSchools(params: Record<string, unknown>) {
    const options = this.createClient(this.schoolApiEndpoint, params);
    return this.getData(options);
  }

  getClasses() {
    const options = this.createClient(this.classApiEndpoint);
    return this.getData(options);
  }

  getStudents() {
    const options = this.createClient(this.studentApiEndpoint);
    return this.getData(options);
  }

  getStaff() {
    const options = this.createClient(this.staffApiEndpoint);
    return this.getData(options);
  }

  getData(options: HttpOptions) {
    return new Promise((resolve, reject) => {
      const req = https.request(options, res => {
        const chunks: Buffer[] = [];
        res.on('data', data => chunks.push(data));
        res.on('end', () => {
          const stringBuffer = Buffer.concat(chunks).toString();
          const jsonResponse = JSON.parse(stringBuffer);
          const resBody =  jsonResponse ? jsonResponse : stringBuffer;
          res.statusCode === 200 ? resolve(resBody.data) : reject(new HttpError(Number(res.statusCode), resBody));
        })
      })
      req.on('error', error => {
        reject(error);
      });
      req.end();
    })
  }
}
