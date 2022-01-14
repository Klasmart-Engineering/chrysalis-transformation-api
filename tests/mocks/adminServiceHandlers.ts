import { graphql } from 'msw';
import { schoolForUs } from '../utils/school';

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
      );
    }

    // When authenticated & has pagination cursor, respond with a query payload
    const { cursor } = req.variables;
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
      );
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
    );
  }),

  // Handles a "rolesConnection" query
  graphql.query('getRoles', (req, res, ctx) => {
    if (!req.headers.get('Authorization')) {
      // When not authenticated, respond with an error
      return res(
        ctx.errors([
          {
            message: 'Not authenticated',
            errorType: 'AuthenticationError',
          },
        ])
      );
    }

    // When authenticated & has pagination cursor, respond with a query payload
    const { cursor } = req.variables;
    if (cursor) {
      return res(
        ctx.data({
          rolesConnection: {
            totalCount: 2,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor:
                'eyJyb2xlX2lkIjoiMzliZGYzYWYtODNiOS00ZjRlLWEzMDEtNjE4Yjk2N2UwZDYyIn0=',
              endCursor:
                'eyJyb2xlX2lkIjoiMzliZGYzYWYtODNiOS00ZjRlLWEzMDEtNjE4Yjk2N2UwZDYyIn0=',
            },
            edges: [
              {
                node: {
                  id: '39bdf3af-83b9-4f4e-a301-618b967e0d62',
                  name: 'Organization Admin',
                  status: 'active',
                  system: true,
                },
              },
            ],
          },
        })
      );
    }

    // When authenticated and without pagination cursor, respond with a query payload
    return res(
      ctx.data({
        rolesConnection: {
          totalCount: 2,
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor:
              'eyJyb2xlX2lkIjoiMzM5NDcwZTktNjU1My00NjUzLTkxMDctMTE5NDVjOTNlM2MwIn0=',
            endCursor:
              'eyJyb2xlX2lkIjoiMzM5NDcwZTktNjU1My00NjUzLTkxMDctMTE5NDVjOTNlM2MwIn0=',
          },
          edges: [
            {
              node: {
                id: '339470e9-6553-4653-9107-11945c93e3c0',
                name: 'Parent',
                status: 'active',
                system: true,
              },
            },
          ],
        },
      })
    );
  }),

  // Handles a "organizationsConnection" query
  graphql.query('getOrganizations', (req, res, ctx) => {
    if (!req.headers.get('Authorization')) {
      // When not authenticated, respond with an error
      return res(
        ctx.errors([
          {
            message: 'Not authenticated',
            errorType: 'AuthenticationError',
          },
        ])
      );
    }

    // When authenticated and without pagination cursor, respond with a query payload
    return res(
      ctx.data({
        organizationsConnection: {
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor:
              'eyJvcmdhbml6YXRpb25faWQiOiIwMDFiZTg3OC0xMWMyLTQwZGMtYWQyNS1iZmJjYmY2ZjA5NjAifQ==',
            endCursor:
              'eyJvcmdhbml6YXRpb25faWQiOiIwMDFiZTg3OC0xMWMyLTQwZGMtYWQyNS1iZmJjYmY2ZjA5NjAifQ==',
          },
          edges: [
            {
              node: {
                id: '001be878-11c2-40dc-ad25-bfbcbf6f0960',
                name: 'Chrysalis BLP Classic',
                status: 'active',
              },
            },
          ],
        },
      })
    );
  }),

  graphql.mutation('createSchools', (req, res, ctx) => {
    if (!req.headers.get('Authorization')) {
      return res(
        ctx.errors([
          {
            message: 'Not authenticated',
            errorType: 'AuthenticationError',
          },
        ])
      );
    }
 
    if (!req.body) {
      return res(
        ctx.errors([
          {
            message: 'No Schools',
            errorType: 'InvalidDataError',
          },
        ])
      );
    }

    return res(
      ctx.data(schoolForUs)
    )
  }),
];
