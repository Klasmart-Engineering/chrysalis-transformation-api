import { schoolSchema } from '../../src/validatorsSchemes';

export const validSchool = {
  name: 'name',
  clientUuid: 'cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3',
  klOrgUuid: 'cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3',
  programNames: ['program name', 'program name2'],
  clientOrgUuid: 'cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3',
  organizationName: 'organization name',
};

export const schoolForUs = {
  name: 'school1',
  shortCode: 'shortCode',
  organizationId: 'b3e9119f-18ac-437e-b460-6d54d99e8ee1'
}

export const invalidSchool = {
  name: '',
  clientUuid: 'cdc9a77f-ac83-',
  klOrgUuid: 'cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3',
  programNames: ['program name', 'program name2'],
  clientOrgUuid: 'cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3',
  organizationName: 'organization name',
};

interface School {
  name: string;
  clientUuid: string;
  klOrgUuid: string;
  programNames: string[];
  clientOrgUuid: string;
  organizationName: string;
}

export const isSchoolValid = (school: School) => {
  try {
    const { error } = schoolSchema.validate(school, { abortEarly: false });
    return !error;
  } catch (error) {
    return false;
  }
};
