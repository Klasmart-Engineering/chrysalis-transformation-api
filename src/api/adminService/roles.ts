import { gql } from '@apollo/client/core';

export const GET_ROLES = gql`
  query getRoles($count: PageSize, $cursor: String) {
    rolesConnection(
      direction: FORWARD
      directionArgs: { count: $count, cursor: $cursor }
      filter: { status: { operator: eq, value: "active" } }
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
          system
        }
      }
    }
  }
`;
