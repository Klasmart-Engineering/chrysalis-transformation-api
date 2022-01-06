import axios, { Axios, Method } from 'axios';
import createError, { HttpError } from 'http-errors';
import { C1AuthEndpoints } from '../config/c1Endpoints';
import log from './logging';

type LoginPayload = {
  Username: string;
  Password: string;
};

export type AuthResponse = {
  APIUserID: number;
  JwtToken: string;
  RefreshToken: string;
};

// Actual refresh is on 600_000
const REFRESH_TOKEN_INTERVAL = 550_000;

export class HttpClient {
  private readonly _client: Axios;

  private accessToken: string;
  private refreshToken: string;
  private refreshInFlight = false;

  private constructor(
    unauthenticatedClient: Axios,
    accessToken: string,
    refreshToken: string,
    refreshTokenInterval: number
  ) {
    this._client = unauthenticatedClient;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    setInterval(async () => {
      await this.refreshAccessToken();
    }, refreshTokenInterval);
  }

  public static async initialize(
    url: string,
    refreshTokenInterval = REFRESH_TOKEN_INTERVAL
  ): Promise<HttpClient> {
    if (url.length === 0) {
      log.error(
        'Invalid URL passed, please check `C1_API_HOSTNAME` environment variable',
        { error: 'invalid/missing environment variable' }
      );
      throw new Error('Invalid URL');
    }

    const baseClient = axios.create({
      baseURL: url,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    baseClient.interceptors.response.use(
      function (response) {
        return response;
      },
      function (error) {
        if (error.response) {
          const { data, status } = error.response;
          return Promise.reject(createError(status, data));
        }
        return Promise.reject(error);
      }
    );

    const loginPayload = this.generateLoginCredentials();

    try {
      const { data } = await baseClient.post<AuthResponse>(
        C1AuthEndpoints.login,
        loginPayload
      );
      const client = new HttpClient(
        baseClient,
        data.JwtToken,
        data.RefreshToken,
        refreshTokenInterval
      );
      log.info(`Initialized base HTTP client for: ${url}`);
      return client;
    } catch (error) {
      if (error instanceof HttpError) {
        log.error(`Failed to log-in to the API: ${url}`, {
          error: error.data,
          status: error.status,
        });
      } else {
        log.error('Unexpected error occured while trying to log in to API', {
          error,
        });
      }
      throw error;
    }
  }

  public async get<T>(url: string) {
    log.debug(`Sending GET Request to ${url}`);
    return this.sendRequest<T>(url, 'GET');
  }
  public async post<T>(url: string, body?: unknown) {
    log.debug(`Sending POST Request to ${url}`);
    return this.sendRequest<T>(url, 'POST', body);
  }

  get getHttpClient(): Axios {
    return this._client;
  }

  private async sendRequest<T>(
    url: string,
    method: Method,
    body: unknown = {}
  ) {
    return this._client.request<T>({
      method,
      url,
      data: body,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Cookie: `RefreshToken=${this.refreshToken}`,
      },
    });
  }

  private async refreshAccessToken(): Promise<void> {
    if (this.refreshInFlight) return;
    this.refreshInFlight = true;
    log.debug('Attempting to refresh access token');
    try {
      const result = await this.post<AuthResponse>(C1AuthEndpoints.refresh);
      this.accessToken = result.data.JwtToken;
      this.refreshToken = result.data.RefreshToken;
    } catch (error) {
      log.error('Failed to refresh access token', { error });
    } finally {
      this.refreshInFlight = false;
    }
    log.debug('Successfully refreshed access token');
  }

  private static generateLoginCredentials(): LoginPayload {
    const Username = process.env.C1_API_USERNAME;
    const Password = process.env.C1_API_PASSWORD;
    if (typeof Username !== 'string' || Username.length === 0) {
      log.error(
        'Invalid username passed, please check `C1_API_USERNAME` environment variable',
        { error: 'invalid/missing environment variable' }
      );
      throw new Error('Failed to parse API Username');
    }
    if (typeof Password !== 'string' || Password.length === 0) {
      log.error(
        'Invalid password passed, please check `C1_API_PASSWORD` environment variable',
        { error: 'invalid/missing environment variable' }
      );
      throw new Error('Failed to parse API Password');
    }
    return { Username, Password };
  }
}
