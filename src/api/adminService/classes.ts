import { FetchResult, gql } from '@apollo/client/core';
import { AdminService } from '../../services/adminService';
import { AddClassesToSchoolRequest, AddClassesToSchoolResponse, CreateClassesRequest, CreateClassesResponse } from './types';

const { ADMIN_SERVICE_JWT = '' } = process.env;

const GET_CLASSES_QUERY = gql`
  query getClasses($count: PageSize, $cursor: String, $organizationId: UUID!) {
    classesConnection(
      direction: FORWARD
      directionArgs: { count: $count, cursor: $cursor }
      filter: { 
		  	status: { operator: eq, value: "active" }
				organizationId: { operator: eq, value: $organizationId }
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
					shortCode
					schoolsConnection (filter: {}) {
						edges {
							node {
								id
								name
								organizationId
							}
						}
					}
        }
      }
    }
  }
`;

const CREATE_CLASSES_MUTATION = gql`
  mutation createClasses($input: [CreateClassInput!]!) {
    createClasses(input: $input) {
			classes {
				id
				name
				status
				shortCode
			}
		}
  }
`;

const ADD_CLASSES_TO_SCHOOL_MUTATION = gql`
  mutation addClassesToSchools($input: [AddClassesToSchoolInput!]!) {
    addClassesToSchools(input: $input) {
			schools {
				id
				name
				classesConnection(filter: {}) {
					edges {
						node {
							id
							name
						}
					}
				}
			}
		}
  }
`;

export async function getClasses(
	organizationId: string,
	cursor?: string,
	count?: number
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
	const adminService = await AdminService.getInstance();
	const serviceResponse = await adminService.client
		.query({
			query: GET_CLASSES_QUERY,
			variables: {
				count: count || 50,
				cursor: cursor,
				organizationId: organizationId,
			},
			context: {
				headers: {
					authorization: ADMIN_SERVICE_JWT,
				},
			},
		});

	return serviceResponse;
}

export const createClasses = async (
	input: CreateClassesRequest[]
): Promise<FetchResult<CreateClassesResponse>> => {
	const adminService = await AdminService.getInstance();
	const serviceResponse = await adminService.client
		.mutate({
			mutation: CREATE_CLASSES_MUTATION,
			variables: {
				input: input
			},
			context: {
				headers: {
					authorization: ADMIN_SERVICE_JWT,
				},
			},
		});

	return serviceResponse;
}

export const addClassesToSchool = async (
	input: AddClassesToSchoolRequest[]
): Promise<FetchResult<AddClassesToSchoolResponse>> => {
	const adminService = await AdminService.getInstance();
	const serviceResponse = await adminService.client
		.mutate({
			mutation: ADD_CLASSES_TO_SCHOOL_MUTATION,
			variables: {
				input
			},
			context: {
				headers: {
					authorization: ADMIN_SERVICE_JWT,
				},
			},
		});

	return serviceResponse;
}