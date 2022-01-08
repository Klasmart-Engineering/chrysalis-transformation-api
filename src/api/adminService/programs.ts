import { gql } from '@apollo/client/core';

export const GET_PROGRAMS = gql`
  query getPrograms($count: PageSize, $cursor: String) {
    programsConnection(
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
        }
      }
    }
  }
`;
