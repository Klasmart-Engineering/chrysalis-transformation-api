import {
  ClassQuerySchema,
  OrganizationQuerySchema,
  UserQuerySchema
} from './clientSchemas';

export interface UsersToOrganizationSchema {
  ExternalOrganizationUUID: string;
  ExternalUserUUIDs: string[];
  RoleIdentifiers: string[];
}

export interface UsersToClassSchema {
  ExternalClassUUID: string;
  ExternalTeacherUUIDs: string[];
  ExternalStudentUUIDs: string[];
}

export interface UsersByOrgs {
  organization: OrganizationQuerySchema;
  users: UserQuerySchema[];
}

export interface UsersBySchools {
  schoolUuid: string;
  usersUuids: string[];
}

export interface ClassesBySchools {
  schoolUuid: string;
  classesUuids: string[];
}

export interface ClassesByOrg {
  organization: OrganizationQuerySchema;
  classes: ClassQuerySchema[];
}
