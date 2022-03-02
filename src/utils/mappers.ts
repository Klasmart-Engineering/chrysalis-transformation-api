import {
  ClassesBySchools,
  UsersByOrgs,
  UsersBySchools,
  UsersToClassSchema,
  UsersToOrganizationSchema,
} from '../interfaces/backendSchemas';
import {
  ClassInformation,
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
  if (user.KLRoleName.toLowerCase().includes('teacher')) {
    userToClass.ExternalTeacherUUIDs.push(user.UserUUID);
  }
  if (user.KLRoleName.toLowerCase().includes('student')) {
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


const mapClassesBySchools = (classes: ClassQuerySchema[]) => {
  return classes.reduce((acc: ClassesBySchools[], clazz: ClassQuerySchema) => {
    const { SchoolUUID, ClassUUID } = clazz;
    const existingSchool = acc.find(
      school => school.schoolUuid === SchoolUUID
    );

    if (existingSchool) {
      existingSchool.classesUuids.push(ClassUUID);
    } else {
      acc.push(
        {
          schoolUuid: SchoolUUID,
          classesUuids: [ClassUUID]
        }
      );
    }

    return acc;
  }, []);
}

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

const mapUsersBySchools = (users: UserQuerySchema[]) => {
  return users.reduce((acc: UsersBySchools[], user: UserQuerySchema) => {
    const { SchoolUUID, UserUUID } = user;
    const existingSchool = acc.find(
      school => school.schoolUuid === SchoolUUID
    );

    if (existingSchool) {
      existingSchool.usersUuids.push(UserUUID);
    } else {
      acc.push(
        {
          schoolUuid: SchoolUUID,
          usersUuids: [UserUUID]
        }
      );
    }
  
    return acc;
  }, []);
}

const addUsersToClassroom = (users: UserQuerySchema[]) => {
  return users.reduce((acc: UsersToClassSchema[], user) => {
    user.ClassInformation &&
     user.ClassInformation.forEach(
      (classInfo: ClassInformation) => {
        const { ClassRole, ClassUUID } = classInfo;

        const userToClass = acc.find(
          (u2c) => u2c.ExternalClassUUID === classInfo.ClassUUID
        );
  
        if (userToClass) {
          appendUserIdBasedOnRole(
            userToClass, 
            { UserUUID: user.UserUUID, KLRoleName: ClassRole }
          );
        } else {
          const newUserToClass = {
            ExternalClassUUID: ClassUUID,
            ExternalTeacherUUIDs: [],
            ExternalStudentUUIDs: [],
          };

          appendUserIdBasedOnRole(
            newUserToClass, 
            { UserUUID: user.UserUUID, KLRoleName: ClassRole }
          );
          acc.push(newUserToClass);
        }
      }
    )

    return acc;
  }, []);
}

export { 
  addUsersToClass, 
  addUsersToOrganization,
  mapClassesBySchools,
  mapUsersByOrgs, 
  addUsersToClassroom,
  mapUsersBySchools,
};
