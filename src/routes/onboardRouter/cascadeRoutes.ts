import express, { Request, Response } from 'express';
import {
  ClassQuerySchema, 
  OrganizationQuerySchema, 
  SchoolQuerySchema, 
  UserQuerySchema
} from '../../interfaces/clientSchemas';
import { BackendService } from '../../services/backendService';
import { C1Service } from '../../services/c1Service';

const router = express.Router();
const service = new C1Service();
const backendService = BackendService.getInstance();

router.post('/', async (req: Request, res: Response) => {
  const { organizationNames = [] }: { organizationNames: string[] } = req.body;

  let organizations: Array<OrganizationQuerySchema> = await service.getOrganizations();
  let schools: Array<SchoolQuerySchema> = [];
  let classes: Array<ClassQuerySchema> = [];
  let users: Array<UserQuerySchema> = [];

  if (organizationNames.length) {
    organizations = organizations.filter((org) =>organizationNames.includes(org.OrganizationName));
  }

  backendService.mapOrganizationsToProto(organizations);
  
  for (const organization of organizations) {
    const orgSchools: SchoolQuerySchema[] = await service.getSchools([organization.OrganizationUUID, 'Schools']);
    schools = [
      ...schools,
      ...orgSchools
    ];

    backendService.mapSchoolsToProto(orgSchools, organization.OrganizationUUID);

    for (const school of schools) {
      const schoolUsers: UserQuerySchema[] =
        await service.getAllSchoolUsers(school.SchoolUUID);
      const schoolClasses: ClassQuerySchema[] =
        await service.getClasses([school.SchoolUUID]);
      classes = [
        ...classes,
        ...schoolClasses,
      ];
      backendService.mapClassesToProto(
        schoolClasses,
        organization.OrganizationUUID,
        school.SchoolUUID,
      );

      users = [
        ...users,
        ...schoolUsers,
      ];

      backendService.mapUsersToProto(
        schoolUsers,
        organization.OrganizationUUID,
        school.SchoolUUID,
      )
    }
  }

  //await backendService.sendRequest();

  return res.status(200).json(
    {
      organizations: organizations,
      schools: schools,
      classes: classes,
      users: users,
      counts: {
        organizationCount: organizations.length,
        schoolCount: schools.length,
        classCount: classes.length,
        usersCount: users.length
      }
    }
  );  
});

export default router;
