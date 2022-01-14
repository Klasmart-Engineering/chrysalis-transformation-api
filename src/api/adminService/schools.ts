import { FetchResult, gql } from '@apollo/client/core';
import { AdminService } from '../../services/adminService';
import { CreateSchoolInput, CreateSchoolsResponse } from '../../utils/types';

export const ADD_SCHOOLS = gql`
  mutation createSchools($input: [CreateSchoolInput!]!) {
    createSchools(input: $input) {
      schools {
        name,
        shortCode
        organizationId
      }
    }
  }
`;

export const addSchool = async (
  authorization: string,
  schools: CreateSchoolInput[]
): Promise<FetchResult<CreateSchoolsResponse>> => {
  const adminServiceClient = await (await AdminService.getInstance()).client;

  return await adminServiceClient.mutate({
    mutation: ADD_SCHOOLS,
    variables: {
      input: schools
    },
    context: {
      headers: {
        authorization,
      },
    },
  })
}