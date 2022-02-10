import express, { Request, Response } from 'express';
import {
  ClassQuerySchema,
  OrganizationQuerySchema,
  SchoolQuerySchema,
  UserQuerySchema,
} from '../../interfaces/clientSchemas';
import { BackendService } from '../../services/backendService';
import { C1Service } from '../../services/c1Service';
import {
  BackendResponse,
  BackendResponses,
} from '../../interfaces/backendResponse';
import { log, protobufToEntity } from 'cil-lib';
import { addUsersToClass, addUsersToOrganization } from '../../utils';

const router = express.Router();
const service = new C1Service();
const backendService = BackendService.getInstance();

router.post('/', async (req: Request, res: Response) => {
  backendService.resetRequest();
  const { organizationNames = [] }: { organizationNames: string[] } = req.body;

  let allOrganizations: Array<OrganizationQuerySchema> =
    await service.getOrganizations();
  const allSchools: Array<SchoolQuerySchema> = [];

  if (organizationNames.length) {
    allOrganizations = allOrganizations.filter((org) =>
      organizationNames.includes(org.OrganizationName)
    );
  }

  backendService.mapOrganizationsToProto(allOrganizations);

  for (const organization of allOrganizations) {
    const organizationUsers: Array<UserQuerySchema> = [];

    const orgSchools: SchoolQuerySchema[] = await service.getSchools([
      organization.OrganizationUUID,
      'Schools',
    ]);
    allSchools.push(...orgSchools);

    backendService.mapSchoolsToProto(orgSchools);

    for (const school of allSchools) {
      const schoolUsers: UserQuerySchema[] = await service.getAllSchoolUsers(
        school.SchoolUUID
      );
      const schoolClasses: ClassQuerySchema[] = await service.getClasses([
        school.SchoolUUID,
      ]);

      backendService.mapClassesToProto(schoolClasses);

      organizationUsers.push(...schoolUsers);
      backendService.mapUsersToProto(schoolUsers, school.SchoolUUID);

      const usersToClass = addUsersToClass(schoolClasses, schoolUsers);
      backendService.addUsersToClasses(usersToClass);
    }

    const usersToOrganization = addUsersToOrganization(
      organization,
      organizationUsers
    );

    backendService.addUsersToOrganization(usersToOrganization);
  }

  const response = (await backendService.sendRequest()) as BackendResponses;
  let statusCode = 400;
  response.responsesList.forEach((rsp: BackendResponse) => {
    rsp.entityName = protobufToEntity(rsp.entity, log);
    if (rsp.success) {
      statusCode = 200;
    }
  });
  return res.status(statusCode).json(response);
});

export default router;
