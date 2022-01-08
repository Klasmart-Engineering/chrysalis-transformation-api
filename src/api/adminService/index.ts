import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  NormalizedCacheObject,
  from,
} from '@apollo/client/core';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import fetch from 'cross-fetch';
import { RawProgram, Role } from '../../entities';
import { log } from '../../utils';
import { GET_PROGRAMS } from './programs';
import { GET_ROLES } from './roles';

export class AdminService {
  private static _instance: AdminService;
  private context: object;

  private constructor(
    private _client: ApolloClient<NormalizedCacheObject>,
    jwt: string
  ) {
    this.context = { headers: { authorization: `Bearer ${jwt}` } };
  }

  public static async getInstance() {
    if (this._instance) return this._instance;

    const jwt = process.env.ADMIN_SERVICE_JWT;
    if (!jwt || jwt.length === 0) {
      log.error(
        'Invalid Admin Service JWT, please check `ADMIN_SERVICE_JWT` environment variable',
        { error: 'invalid/missing environment variable' }
      );
      throw new Error('Invalid JWT for Admin Service');
    }

    const httpLink = new HttpLink({
      uri: process.env.ADMIN_SERVICE_URL,
      fetch,
    });
    /**
     * Only retry network errors
     *
     * Reference: https://www.apollographql.com/docs/react/api/link/apollo-link-retry/
     */
    const retryLink = new RetryLink({
      delay: {
        initial: 300,
        max: Infinity,
        jitter: true,
      },
      attempts: {
        max: 5,
        retryIf: (error, _operation) => !!error,
      },
    });
    const errorLink = onError(({ graphQLErrors, networkError }) => {
      /**
       * GraphQL errors, will not retry
       *
       * - Syntax errors (e.g., a query was malformed) - 4xx error
       * - Validation errors (e.g., a query included a schema field that doesn't exist) - 4xx error
       * - Resolver errors (e.g., an error occurred while attempting to populate a query field) - 2xx error
       *
       * Reference: https://www.apollographql.com/docs/react/data/error-handling
       */
      if (graphQLErrors)
        graphQLErrors.forEach(({ message, path }) =>
          log.error(`GraphQL query failed`, {
            error: message,
            api: 'admin',
            path,
          })
        );

      // 4xx/5xx errors
      if (networkError)
        log.error(`Network error while attempting a GraphQL call`, {
          error: networkError,
          api: 'admin',
        });
    });

    try {
      const client = new ApolloClient({
        link: from([errorLink, retryLink, httpLink]),
        cache: new InMemoryCache(),
      });

      this._instance = new AdminService(client, jwt);
      log.info('Connected to KidsLoop admin service');
      return this._instance;
    } catch (error) {
      log.error('❌ Failed to connect KidsLoop admin service', { error });
      throw error;
    }
  }

  get client(): ApolloClient<NormalizedCacheObject> {
    return this._client;
  }

  // While loop to get all programs from Admin User service
  async getPrograms(): Promise<RawProgram[]> {
    let hasNextPage = true;
    let cursor = '';

    const programs: RawProgram[] = [];
    while (hasNextPage) {
      /**
       * Don't need to handle errors here because:
       *
       * - 4xx/5xx were handled in `errorLink` when initializing `ApolloClient`
       * - 2xx errors won't exist in this case
       */
      const { data } = await this.client.query({
        query: GET_PROGRAMS,
        variables: {
          count: 50,
          cursor,
        },
        context: this.context,
      });

      const responseData = data.programsConnection;
      hasNextPage = responseData.pageInfo.hasNextPage;
      cursor = responseData.pageInfo.endCursor;

      for (const {
        node: { name, id },
      } of responseData.edges) {
        programs.push({
          name,
          kidsloopUuid: id,
        });
      }
    }
    return programs;
  }

  // While loop to get all roles from Admin User service
  async getRoles(): Promise<Role[]> {
    let hasNextPage = true;
    let cursor = '';
    const roles: Role[] = [];
    while (hasNextPage) {
      /**
       * Don't need to handle errors here because:
       *
       * - 4xx/5xx were handel in `errorLink` while init `ApolloClient`
       * - 2xx errors won't exist in this case
       */
      const { data } = await this.client.query({
        query: GET_ROLES,
        variables: {
          count: 50,
          cursor: cursor,
        },
        context: this.context,
      });

      const responseData = data.rolesConnection;
      hasNextPage = responseData.pageInfo.hasNextPage;
      cursor = responseData.pageInfo.endCursor;

      for (const {
        node: { name, id, system },
      } of responseData.edges) {
        roles.push(new Role(name, id, system));
      }
    }

    return roles;
  }
}
