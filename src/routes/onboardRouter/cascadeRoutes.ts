import express, { Request, Response } from 'express';
import {
  ClassQuerySchema,
  OrganizationQuerySchema,
  SchoolQuerySchema,
  UserQuerySchema
} from '../../interfaces/clientSchemas';
import { UsersToOrganizationSchema } from '../../interfaces/backendSchemas';
import { BackendService } from '../../services/backendService';
import { C1Service } from '../../services/c1Service';

const router = express.Router();
const service = new C1Service();
const backendService = BackendService.getInstance();

router.post('/', async (req: Request, res: Response) => {
  const { organizationNames = [] }: { organizationNames: string[] } = req.body;

  let allOrganizations: Array<OrganizationQuerySchema> = await service.getOrganizations();
  const allSchools: Array<SchoolQuerySchema> = [];
  const allClasses: Array<ClassQuerySchema> = [];
  const allUsers: Array<UserQuerySchema> = [];

  if (organizationNames.length) {
    allOrganizations = allOrganizations.filter((org) => organizationNames.includes(org.OrganizationName));
  }

  backendService.mapOrganizationsToProto(allOrganizations);

  for (const organization of allOrganizations) {
    const organizationUsers: Array<UserQuerySchema> = [];

    const orgSchools: SchoolQuerySchema[] = await service.getSchools([organization.OrganizationUUID, 'Schools']);
    allSchools.push(...orgSchools);

    backendService.mapSchoolsToProto(orgSchools, organization.OrganizationUUID);

    for (const school of allSchools) {
      const schoolUsers: UserQuerySchema[] =
        await service.getAllSchoolUsers(school.SchoolUUID);
      const schoolClasses: ClassQuerySchema[] =
        await service.getClasses([school.SchoolUUID]);

      backendService.mapClassesToProto(
        schoolClasses,
        organization.OrganizationUUID,
        school.SchoolUUID,
      );

      organizationUsers.push(...schoolUsers)
      allClasses.push(...schoolClasses);
      allUsers.push(...schoolUsers);

      backendService.mapUsersToProto(
        schoolUsers,
        organization.OrganizationUUID,
        school.SchoolUUID,
      );
    }

    const usersToOrganization = organizationUsers.reduce((acc: UsersToOrganizationSchema[], user) => {
      const { UserUUID, KLRoleName } = user;

      KLRoleName.forEach(roleName => {
        const userToOrg = acc.find(u2r => u2r.RoleIdentifiers.includes(roleName))

        if (userToOrg) {
          userToOrg.ExternalUserUUIDs.push(UserUUID)
        } else {
          const newUserToOrg: UsersToOrganizationSchema = {
            ExternalOrganizationUUID: organization.OrganizationUUID,
            RoleIdentifiers: [roleName],
            ExternalUserUUIDs: [UserUUID],
          }

          acc.push(newUserToOrg)
        }
      })

      return acc
    }, []);

    backendService.addUsersToOrganization(usersToOrganization)
  }

  //await backendService.sendRequest();

  return res.status(200).json(
    {
      organizations: allOrganizations,
      schools: allSchools,
      classes: allClasses,
      users: allUsers,
      counts: {
        organizationCount: allOrganizations.length,
        schoolCount: allSchools.length,
        classCount: allClasses.length,
        usersCount: allUsers.length
      }
    }
  );
});

export default router;
