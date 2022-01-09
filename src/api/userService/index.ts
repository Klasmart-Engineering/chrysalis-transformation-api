import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  NormalizedCacheObject,
  from,
  TypedDocumentNode,
  DocumentNode,
} from '@apollo/client/core';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import fetch from 'cross-fetch';
import { RawProgram, Role } from '../../entities';
import { ClientUuid, log, Uuid } from '../../utils';
import { GET_ORGANIZATION } from './organization';
import { GET_PROGRAMS_BY_ORGANIZATION, GET_SYSTEM_PROGRAMS } from './programs';
import { GET_ORGANIZATION_ROLES, GET_SYSTEM_ROLES } from './roles';

export class UserService {
  private static _instance: UserService;
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

      this._instance = new UserService(client, jwt);
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

  public async getSystemPrograms(): Promise<RawProgram[]> {
    const transformer = ({ name, id }: { name: string; id: Uuid }) =>
      new RawProgram(name, id);

    const results = await this.traversePaginatedQuery(
      GET_SYSTEM_PROGRAMS,
      transformer
    );

    return results;
  }

  public async getOrganizationPrograms(
    orgId: ClientUuid
  ): Promise<RawProgram[]> {
    const transformer = ({ id, name }: { id: Uuid; name: string }) =>
      new RawProgram(name, id, false, orgId);
    const results = await this.traversePaginatedQuery(
      GET_PROGRAMS_BY_ORGANIZATION,
      transformer,
      { orgId }
    );
    return results;
  }

  public async getSystemRoles(): Promise<Role[]> {
    const transformer = ({ id, name }: { id: Uuid; name: string }) =>
      new Role(name, id, true);
    const results = await this.traversePaginatedQuery(
      GET_SYSTEM_ROLES,
      transformer
    );
    return results;
  }

  public async getOrganizationRoles(orgId: ClientUuid): Promise<Role[]> {
    const transformer = ({ id, name }: { id: Uuid; name: string }) =>
      new Role(name, id, false, orgId);
    const results = await this.traversePaginatedQuery(
      GET_ORGANIZATION_ROLES,
      transformer,
      { orgId }
    );
    return results;
  }

  public async getOrganization(
    orgName: string
  ): Promise<{ klUuid: Uuid; klShortCode: string }> {
    const transformer = ({
      id,
      shortCode,
    }: {
      id: string;
      shortCode: string;
    }) => ({
      klUuid: id,
      klShortCode: shortCode,
    });
    const org = await this.traversePaginatedQuery(
      GET_ORGANIZATION,
      transformer,
      { orgName }
    );
    if (org.length > 1)
      throw new Error(
        `Unexpectedly found more than one organization with the name ${orgName}, unable to identify which one should be used`
      );
    if (org.length === 0) throw new Error(`Organization ${orgName} not found`);
    return org[0];
  }

  /**
   * A helper function to send a request to a paginated API and walk the
   * full length of the cursor, collating all the responses before returning
   * an array of items
   *
   * @param {string} query - The GraphQL query to be sent
   * @param {function} transformer - A function that will be called on each
   * node within the response to convert the response data into the desired format
   * @param {object} variables - Any variables that need to be provided to the
   * GraphQL query
   * @returns {T[]} An array of the transformed type
   */
  private async traversePaginatedQuery<T, U>(
    query: DocumentNode | TypedDocumentNode,
    transformer: (responseData: U) => T,
    variables?: object
  ): Promise<T[]> {
    let hasNextPage = true;
    let cursor = '';

    const result: T[] = [];
    while (hasNextPage) {
      /**
       * Don't need to handle errors here because:
       *
       * - 4xx/5xx were handled in `errorLink` when initializing `ApolloClient`
       * - 2xx errors won't exist in this case
       */
      const { data } = await this.client.query({
        query,
        variables: {
          count: 50,
          cursor,
          ...variables,
        },
        context: this.context,
      });

      const responseData = data.programsConnection;
      hasNextPage = responseData.pageInfo.hasNextPage;
      cursor = responseData.pageInfo.endCursor;

      for (const node of responseData.edges) {
        result.push(transformer(node));
      }
    }
    return result;
  }
}
