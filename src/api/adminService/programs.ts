import { gql } from '@apollo/client/core'
import { AdminService } from '../../services/adminService'

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
`

export async function getPrograms(
    authorization: string,
    cursor?: string,
    count?: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
    const adminServiceClient = await (await AdminService.getInstance()).client

    return await adminServiceClient.query({
        query: GET_PROGRAMS,
        variables: {
            count: count || 50,
            cursor: cursor,
        },
        context: {
            headers: {
                authorization,
            },
        },
    })
}
