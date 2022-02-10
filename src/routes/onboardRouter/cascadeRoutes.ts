import express, { Request, Response } from 'express';
import {
  ClassQuerySchema,
  OrganizationQuerySchema,
  SchoolQuerySchema,
  UserQuerySchema,
} from '../../interfaces/clientSchemas';
import { UsersToClassSchema, UsersToOrganizationSchema, } from '../../interfaces/backendSchemas';
import { BackendService } from '../../services/backendService';
import { C1Service } from '../../services/c1Service';
import { BackendResponse, BackendResponses, } from '../../interfaces/backendResponse';
import { log, protobufToEntity } from 'cil-lib';

const router = express.Router();
const service = new C1Service();
const backendService = BackendService.getInstance();

const addUsersToOrganization = (
  organization: OrganizationQuerySchema,
  organizationUsers: UserQuerySchema[]
) => {
  return organizationUsers.reduce(
    (acc: UsersToOrganizationSchema[], user) => {
      const { UserUUID, KLRoleName } = user;

      KLRoleName.forEach((roleName) => {
        const userToOrg = acc.find((u2r) =>
          u2r.RoleIdentifiers.includes(roleName)
        );

        if (userToOrg) {
          userToOrg.ExternalUserUUIDs.push(UserUUID);
        } else {
          const newUserToOrg: UsersToOrganizationSchema = {
            ExternalOrganizationUUID: organization.OrganizationUUID,
            RoleIdentifiers: [roleName],
            ExternalUserUUIDs: [UserUUID],
          };

          acc.push(newUserToOrg);
        }
      });

      return acc;
    },
    []
  );
};

const appendUserIdBasedOnRole = (
  userToClass: UsersToClassSchema,
  user: { UserUUID: string; KLRoleName: string }
) => {
  if (user.KLRoleName.includes('teacher')) {
    userToClass.ExternalTeacherUUIDs.push(user.UserUUID);
  }
  if (user.KLRoleName.includes('student')) {
    userToClass.ExternalStudentUUIDs.push(user.UserUUID);
  }

  return userToClass;
};

const addUsersToClass = (
  schoolClasses: ClassQuerySchema[],
  schoolUsers: UserQuerySchema[]
) => {
  const usersForClassName = schoolUsers.reduce(
    (acc: Record<string, { UserUUID: string; KLRoleName: string }[]>, user) => {
      const { UserUUID, KLRoleName, ClassName } = user;

      ClassName.forEach((className) => {
        // TODO: change this when there'll be a correct mapping between user roles and classes
        const userRole = KLRoleName[0]?.toLowerCase();

        if (acc[className]) {
          acc[className].push({ UserUUID, KLRoleName: userRole });
        } else {
          acc[className] = [{ UserUUID, KLRoleName: userRole }];
        }
      });

      return acc;
    },
    {}
  );

  return schoolClasses.reduce(
    (acc: UsersToClassSchema[], classData) => {
      const { ClassUUID, ClassName } = classData;

      usersForClassName[ClassName].forEach((user) => {
        const userToClass = acc.find(
          (u2c) => u2c.ExternalClassUUID === ClassUUID
        );

        if (userToClass) {
          appendUserIdBasedOnRole(userToClass, user);
        } else {
          const newUserToClass = {
            ExternalClassUUID: ClassUUID,
            ExternalTeacherUUIDs: [],
            ExternalStudentUUIDs: [],
          };

          appendUserIdBasedOnRole(newUserToClass, user);
          acc.push(newUserToClass);
        }
      });

      return acc;
    },
    []
  );
};

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
