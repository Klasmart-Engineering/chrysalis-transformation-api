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
  addUsersToClass,
  addUsersToOrganization,
  parseResponse
} from '../../utils';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const service = await C1Service.getInstance();
  const backendService = BackendService.getInstance();
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

    const orgSchools: SchoolQuerySchema[] = await service.getOrgSchools([
      organization.OrganizationUUID,
      'Schools',
    ]);
    allSchools.push(...orgSchools);

    backendService.mapSchoolsToProto(orgSchools);

    for (const school of allSchools) {
      const schoolUsers: UserQuerySchema[] = await service.getAllSchoolUsers(
        school.SchoolUUID
      );
      const schoolClasses: ClassQuerySchema[] = await service.getSchoolClasses([
        school.SchoolUUID,
      ]);

      backendService.mapClassesToProto(schoolClasses);

      organizationUsers.push(...schoolUsers);
      //TODO delete school uuid when be provided by C1 in user object
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

  const { statusCode, response } = await parseResponse();

  return res.status(statusCode).json(response);
});

export default router;
