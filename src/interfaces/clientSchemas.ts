type classRoles = 'Student' | 'Teacher';

export interface OrganizationQuerySchema {
  OrganizationName: string;
  OrganizationUUID: string;
}

export interface SchoolQuerySchema {
  SchoolUUID: string;
  SchoolName: string;
  SchoolShortCode: string;
  Source: string;
  OrganizationName: string;
  ProgramName: string[];
  OrganizationUUID: string;
}

export interface ClassQuerySchema {
  ClassUUID: string;
  ClassName: string;
  ClassShortCode: string;
  OrganizationName: string;
  SchoolName: string;
  ProgramName: string[];
  OrganizationUUID: string;
  SchoolUUID: string;
}

export interface UserQuerySchema {
  OrganizationName: string;
  UserUUID: string;
  UserGivenName: string;
  UserFamilyName: string;
  Email: string;
  Phone: string;
  DateOfBirth: string;
  Gender: string;
  KLRoleName: string[];
  SchoolName: string;
  SchoolUUID: string;
  ClassName: string[];
  SchoolRoleName: string[];
  Username: string;
  OrganizationUUID: string;
  ClassInformation: ClassInformation[]
}

export interface ClassInformation {
  ClassUUID: string;
  ClassRole: classRoles;
}

export enum classRole {
  'Student',
  'Teacher',
}

export interface FeedbackSchema {
  Status: boolean;
  Messages: string;
}
