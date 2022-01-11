import { SchoolQuerySchema, ClassQuerySchema } from '../services/c1Schemas';

export class MappedSchool {
  name: string;
  clientUuid: string;
  klOrgUuid: string | null;
  programNames: string[];
  organizationName: string;
  shortCode: string | null;

  constructor(orgUuid: string, school: SchoolQuerySchema) {
    this.klOrgUuid = null;
    this.name = school.SchoolName;
    this.shortCode = school.SchoolShortCode;
    this.clientUuid = school.SchoolUUID;
    this.programNames = school.ProgramName;
    this.organizationName = school.OrganizationName;
  }
}

export class MappedClass {
  name: string;
  clientUuid: string;
  klOrgUuid: string | null;
  shortCode: string;
  schoolName: string;
  clientOrgUuid: string | null;
  programNames: string[];
  organizationName: string;

  constructor(schoolClass: ClassQuerySchema) {
    this.klOrgUuid = null;
    this.clientOrgUuid = null;
    this.clientUuid = '';
    this.name = schoolClass.ClassName;
    this.shortCode = schoolClass.ClassShortCode;
    this.schoolName = schoolClass.SchoolName;
    this.programNames = schoolClass.ProgramName;
    this.organizationName = schoolClass.OrganizationName;
  }
}
