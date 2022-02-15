import {
  UsersByOrgs,
  UsersToClassSchema,
  UsersToOrganizationSchema,
} from '../interfaces/backendSchemas';
import {
  ClassQuerySchema,
  OrganizationQuerySchema,
  UserQuerySchema,
} from '../interfaces/clientSchemas';

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

  return schoolClasses.reduce((acc: UsersToClassSchema[], classData) => {
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
  }, []);
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

const addUsersToOrganization = (
  organization: OrganizationQuerySchema,
  organizationUsers: UserQuerySchema[]
) => {
  return organizationUsers.reduce((acc: UsersToOrganizationSchema[], user) => {
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
  }, []);
};

const mapUsersByOrgs = (users: UserQuerySchema[]) => {
  return users.reduce((acc: UsersByOrgs[], user: UserQuerySchema) => {
    const organization: OrganizationQuerySchema = {
      OrganizationUUID: user.OrganizationUUID, 
      OrganizationName: user.OrganizationName
    };
  
    const existingOrg = acc.find(
      org => org.organization.OrganizationName === user.OrganizationName
    );
  
    if (existingOrg) {
      existingOrg.users.push(user);
    } else {
      acc.push(
        {
          organization,
          users: [user]
        }
      );
    }
  
    return acc;
  }, []);
}

const addUsersToClassroom = (users: UserQuerySchema[]) => {
  return users.reduce((acc: UsersToClassSchema[], user) => {
    const { ClassUUID } = user.ClassInformation;
    
    // TODO after c1 the add ClassInformation: [...] map over it instead of ClassName
    user.ClassName.forEach((className) => {
      const userToClass = acc.find(
        (u2c) => u2c.ExternalClassUUID === ClassUUID
      );

       // TODO after c1 the add ClassInformation: [...] remove this map will be above
      user.KLRoleName.forEach((role) => {
        if (userToClass) {
          appendUserIdBasedOnRole(
            userToClass, 
            { UserUUID: user.UserUUID, KLRoleName: role }
          );
        } else {
          const newUserToClass = {
            ExternalClassUUID: ClassUUID,
            ExternalTeacherUUIDs: [],
            ExternalStudentUUIDs: [],
          };

          appendUserIdBasedOnRole(
            newUserToClass, 
            { UserUUID: user.UserUUID, KLRoleName: role }
          );
          acc.push(newUserToClass);
        }
      })
    });

    return acc;
  }, []);
}

export { addUsersToClass, addUsersToOrganization, mapUsersByOrgs, addUsersToClassroom };
