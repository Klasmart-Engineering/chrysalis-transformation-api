import { graphql } from 'msw'

export const adminServiceHandlers = [
    // Handles a "programsConnection" query
    graphql.query('getPrograms', (req, res, ctx) => {
        if (!req.headers.get('Authorization')) {
            // When not authenticated, respond with an error
            return res(
                ctx.errors([
                    {
                        message: 'Not authenticated',
                        errorType: 'AuthenticationError',
                    },
                ])
            )
        }

        // When authenticated & has pagination cursor, respond with a query payload
        const { cursor } = req.variables
        if (cursor) {
            return res(
                ctx.data({
                    programsConnection: {
                        totalCount: 2,
                        pageInfo: {
                            hasNextPage: false,
                            hasPreviousPage: true,
                            startCursor:
                                'eyJpZCI6IjA0YzYzMGNjLWZhYmUtNDE3Ni04MGYyLTMwYTAyOTkwN2EzMyJ9',
                            endCursor:
                                'eyJpZCI6ImY2NjE3NzM3LTUwMjItNDc4ZC05NjcyLTAzNTQ2NjdlMDMzOCJ9',
                        },
                        edges: [
                            {
                                node: {
                                    id: '14d350f1-a7ba-4f46-bef9-dc847f0cbac5',
                                    name: 'Math',
                                    status: 'active',
                                },
                            },
                        ],
                    },
                })
            )
        }

        // When authenticated and without pagination cursor, respond with a query payload
        return res(
            ctx.data({
                programsConnection: {
                    totalCount: 2,
                    pageInfo: {
                        hasNextPage: true,
                        hasPreviousPage: false,
                        startCursor:
                            'eyJpZCI6IjA0YzYzMGNjLWZhYmUtNDE3Ni04MGYyLTMwYTAyOTkwN2EzMyJ9',
                        endCursor:
                            'eyJpZCI6IjA0YzYzMGNjLWZhYmUtNDE3Ni04MGYyLTMwYTAyOTkwN2EzMyJ9',
                    },
                    edges: [
                        {
                            node: {
                                id: '04c630cc-fabe-4176-80f2-30a029907a33',
                                name: 'Science',
                                status: 'active',
                            },
                        },
                    ],
                },
            })
        )
    }),
]
