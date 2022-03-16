import https from 'https';
import { HttpOptions } from '../interfaces/httpOptions';
import { HttpError } from '../utils';
import { C1Endpoints } from '../config/c1Endpoints';
import { McbEndpoints } from '../config/mcbEnpoints';
import { stringify } from 'query-string';
import logger from '../utils/logging';

export enum Methods {
  get = 'GET',
  post = 'POST',
}

export abstract class BaseRestfulService {
  abstract hostname: string;
  abstract jwtToken: string;
  abstract port: string | undefined;

  createClient(
    path: C1Endpoints | McbEndpoints,
    pathSegments?: string[],
    queryParams?: Record<string, string>,
    method?: Methods,
    contentLength?: number
  ): HttpOptions {
    this.hostnameCheck();
    this.jwtTokenCheck();
    let processedPath = String(path);
    if (pathSegments)
      processedPath += '/' + pathSegments.map((el) => encodeURI(el)).join('/');
    if (queryParams) processedPath += '?' + stringify(queryParams);

    let headers = {
      //Bearer Authorization token for authorize through C1 Api endpoint
      Authorization: 'Bearer ' + this.jwtToken,
      'Content-Type': 'application/json',
    };
    if (contentLength) {
      headers = { ...headers, ...{ 'Content-Length': contentLength } };
    }

    return {
      hostname: this.hostname,
      path: processedPath,
      port: this.port ?? '443',
      method: method ? method : Methods.get,
      headers: headers,
    };
  }

  getData(options: HttpOptions, postData?: string) {
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
          res.statusCode === 200 || res.statusCode === 204
            ? res.statusCode === 200
              ? resolve(resBody)
              : resolve([])
            : reject(new HttpError(Number(res.statusCode), resBody));
        });
      });
      req.on('error', (error) => {
        reject(error);
      });
      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  }

  private hostnameCheck() {
    if (!this.hostname || this.hostname === 'undefined') {
      logger.error('Hostname is not set');
      return;
    }
  }

  private jwtTokenCheck() {
    if (!this.jwtToken || this.hostname === 'undefined') {
      logger.error('Jwt token is not set');
      return;
    }
  }
}
