import { HttpOptions } from '../interfaces/httpOptions';
import https from 'https';
import { HttpError } from '../utils';
import { C1Endpoints } from '../config/c1Endpoints';
import { McbEndpoints } from '../config/mcbEnpoints';
import { stringify } from 'query-string';

enum Methods {
  get = 'GET',
  post = 'POST',
}

export abstract class BaseRestfulService {
  abstract hostname: string;
  abstract jwtToken: string;

  createClient(
    path: C1Endpoints | McbEndpoints,
    pathSegments?: string[],
    queryParams?: Record<string, string>,
    method?: Methods
  ): HttpOptions {
    this.hostnameCheck();
    this.jwtTokenCheck();
    let processedPath = String(path);
    if (pathSegments)
      processedPath += '/' + pathSegments.map((el) => encodeURI(el)).join('/');
    if (queryParams) processedPath += '?' + stringify(queryParams);
    return {
      hostname: this.hostname,
      path: processedPath,
      method: method ? method : Methods.get,
      headers: {
        //Bearer Authorization token for authorize through C1 Api endpoint
        Authorization: 'Bearer ' + this.jwtToken,
        'Content-Type': 'application/json',
      },
    };
  }

  getData(options: HttpOptions) {
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (data) => chunks.push(data));
        res.on('end', () => {
          const stringBuffer = Buffer.concat(chunks).toString();
          let resBody;
          try {
            resBody = JSON.parse(stringBuffer);
          } catch (e) {
            resBody = stringBuffer;
          }
          res.statusCode === 200
            ? resolve(resBody)
            : reject(new HttpError(Number(res.statusCode), resBody));
        });
      });
      req.on('error', (error) => {
        reject(error);
      });
      req.end();
    });
  }

  private hostnameCheck() {
    if (!this.hostname || this.hostname === 'undefined')
      throw new Error('Hostname is not set');
  }

  private jwtTokenCheck() {
    if (!this.jwtToken || this.hostname === 'undefined')
      throw new Error('Jwt token is not set');
  }
}
