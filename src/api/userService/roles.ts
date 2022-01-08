import { gql } from '@apollo/client/core';

export const GET_SYSTEM_ROLES = gql`
  query getSystemRoles($count: PageSize, $cursor: String) {
    rolesConnection(
      direction: FORWARD
      directionArgs: { count: $count, cursor: $cursor }
      filter: { AND : [{ status: { operator: eq, value: "active" } }, { system : { operator: eq, value: true }}] }
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
        }
      }
    }
  }
`;

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
