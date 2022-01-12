import { gql } from '@apollo/client/core';
import { AdminService } from '../../services/adminService';

export const GET_ORGANIZATIONS = gql`
  query getOrganizations($name: String!, $count: PageSize, $cursor: String) {
    organizationsConnection(
      direction: FORWARD
      directionArgs: { count: $count, cursor: $cursor }
      filter: {
        status: { operator: eq, value: "active" }
        name: { operator: eq, value: $name }
      }
    ) {
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        node {
          id
          name
          status
        }
      }
    }
  }
`;

export async function getOrganizations(
  authorization: string,
  name: string,
  cursor?: string,
  count?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const adminServiceClient = await (await AdminService.getInstance()).client;

  return await adminServiceClient.query({
    query: GET_ORGANIZATIONS,
    variables: {
      count: count || 50,
      cursor: cursor,
      name: name,
    },
    context: {
      headers: {
        authorization,
      },
    },
  });
}
