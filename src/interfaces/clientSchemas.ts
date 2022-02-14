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

export interface SchoolsQuerySchema {
  totalRecords: number;
  totalDisplayRecords: number;
  data: SchoolQuerySchema[];
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

export interface ClassesQuerySchema {
  totalRecords: number;
  totalDisplayRecords: number;
  data: ClassQuerySchema[];
}

export interface UsersQuerySchema {
  totalRecords: number;
  totalDisplayRecords: number;
  data: UserQuerySchema[];
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
  ClassName: string[];
  SchoolRoleName: string[];
  Username: string;
  OrganizationUUID: string;
  ClassInformation: {
    ClassUUID: string;
    ClassRole: classRole;
  };
}

enum classRole {
  'Student',
  'Teacher',
}

export interface FeedbackSchema {
  Status: boolean;
  Messages: string;
}

export interface UsersByOrgs {
  organization: OrganizationQuerySchema;
  users: UserQuerySchema[];
}