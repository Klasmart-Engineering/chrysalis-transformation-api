import { HttpOptions } from '../interfaces/httpOptions';
import https from 'https';
import { HttpError } from './httpError';
import logger from './logging';

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

  constructor(hostname: string, loginData: string) {
    this.hostname = hostname;
    this.postData = loginData;
  }

  private async login(path: string) {
    const client = this.createClient(path);
    try {
      const response = (await this.makeRequest(client)) as TokenResponse;
      if (response.JwtToken) this.jwtToken = response.JwtToken;
      if (response.RefreshToken) this.refreshToken = response.RefreshToken;
    } catch (error) {
      logger.error(error);
      throw new Error('Error to login');
    }
  }

  async getAccessToken(path: string) {
    await this.login(path);
    return this.jwtToken;
  }

  private tokenRefresh() {
    //TODO to be done in CIL-62
  }

  async doRefreshToken() {
    //TODO to be done in CIL-62
  }

  createClient(path: string) {
    return {
      hostname: this.hostname,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(this.postData.length),
      },
    };
  }

  private makeRequest(options: HttpOptions) {
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
      req.write(this.postData);
      req.end();
    });
  }
}
