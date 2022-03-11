import { HttpOptions } from '../interfaces/httpOptions';
import https from 'https';
import { HttpError } from './httpResponses';
import logger from './logging';
import { stringify } from './stringify';

type TokenResponse = {
  APIUserID: number;
  JwtToken: string;
  RefreshToken: string;
};

export class AuthServer {
  hostname: string;
  jwtToken = '';
  refreshToken = '';
  postData: string;
  port = '443';

  constructor(hostname: string, loginData: string, port?: string) {
    this.hostname = hostname;
    this.postData = loginData;
    if (port) {
      this.port = port;
    }
  }

  private async login(path: string) {
    const client = this.createClient(path, this.postData);
    try {
      const response = (await this.makeRequest(
        client,
        this.postData
      )) as TokenResponse;
      if (response.JwtToken) this.jwtToken = response.JwtToken;
      if (response.RefreshToken) this.refreshToken = response.RefreshToken;
    } catch (error) {
      const stringifyError = stringify(error)
      logger.error(stringifyError);
    }
  }

  async getAccessToken(path: string) {
    await this.login(path);
    return this.jwtToken;
  }

  private async tokenRefresh(path: string) {
    const client = this.createClient(path, '');
    try {
      const response = (await this.makeRequest(client, '')) as TokenResponse;
      if (response.JwtToken) this.jwtToken = response.JwtToken;
      if (response.RefreshToken) this.refreshToken = response.RefreshToken;
    } catch (error) {
      const stringifyError = stringify(error)
      logger.error(stringifyError);
    }
  }

  async doRefreshToken(path: string) {
    await this.tokenRefresh(path);
    return this.jwtToken;
  }

  createClient(path: string, postData: string) {
    return {
      hostname: this.hostname,
      port: this.port,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(postData.length),
        Cookie: 'RefreshToken=' + this.refreshToken,
      },
    };
  }

  private makeRequest(options: HttpOptions, postData?: string) {
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
        reject(new HttpError(500, error));
      });
      req.write(postData);
      req.end();
    });
  }
}
