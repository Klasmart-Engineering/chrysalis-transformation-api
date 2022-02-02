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
}

export interface ClassQuerySchema {
  ClassUUID: string;
  ClassName: string;
  ClassShortCode: string;
  OrganizationName: string;
  SchoolName: string;
  ProgramName: string[];
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
}
