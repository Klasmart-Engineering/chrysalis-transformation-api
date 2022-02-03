import express, { Request, Response } from 'express';
import {
  ClassQuerySchema,
  OrganizationQuerySchema,
  SchoolQuerySchema,
  UserQuerySchema
} from '../../interfaces/clientSchemas';
import { UsersToClassSchema, UsersToOrganizationSchema } from '../../interfaces/backendSchemas';
import { BackendService } from '../../services/backendService';
import { C1Service } from '../../services/c1Service';

const router = express.Router();
const service = new C1Service();
const backendService = BackendService.getInstance();

const addUsersToOrganization = (
  organization: OrganizationQuerySchema,
  organizationUsers: UserQuerySchema[]
) => {
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

  return usersToOrganization;
}

const appendUserIdBasedOnRole = (userToClass: UsersToClassSchema, user: { UserUUID: string; KLRoleName: string; }) => {
  if (user.KLRoleName.includes('teacher')) {
    userToClass.ExternalTeacherUUIDs.push(user.UserUUID)
  } else if (user.KLRoleName.includes('student')) {
    userToClass.ExternalStudentUUIDs.push(user.UserUUID)
  }

  return userToClass;
}

const addUsersToClass = (
  schoolClasses: ClassQuerySchema[],
  schoolUsers: UserQuerySchema[]
) => {
  const usersForClassName = schoolUsers.reduce((acc: Record<string, { UserUUID: string; KLRoleName: string; }[]>, user) => {
    const { UserUUID, KLRoleName, ClassName } = user;

    ClassName.forEach(className => {
      // TODO: change this when there'll be a correct mapping between user roles and classes
      const userRole = KLRoleName[0]?.toLowerCase()

      if (acc[className]) {
        acc[className].push({ UserUUID, KLRoleName: userRole })
      } else {
        acc[className] = [{ UserUUID, KLRoleName: userRole }]
      }
    })

    return acc
  }, {});

  const usersToClasses = schoolClasses.reduce((acc: UsersToClassSchema[], classData) => {
    const { ClassUUID, ClassName } = classData;

    usersForClassName[ClassName].forEach(user => {
      const userToClass = acc.find(u2c => u2c.ExternalClassUUID === ClassUUID)

      if (userToClass) {
        appendUserIdBasedOnRole(userToClass, user);
      } else {
        const newUserToClass = {
          ExternalClassUUID: ClassUUID,
          ExternalTeacherUUIDs: [],
          ExternalStudentUUIDs: []
        }

        appendUserIdBasedOnRole(newUserToClass, user);
        acc.push(newUserToClass);
      }
    });

    return acc;
  }, [])

  return usersToClasses;
}

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

      const usersToClass = addUsersToClass(schoolClasses, schoolUsers);
      backendService.addUsersToClasses(usersToClass);
    }

    const usersToOrganization = addUsersToOrganization(
      organization,
      organizationUsers
    );

    backendService.addUsersToOrganization(usersToOrganization);
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
