import { school as schoolSchema } from '../../src/validatorsSchemes'

export const validSchool = {
  name: 'name',
  clientUuid: 'cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3',
  klOrgUuid: 'cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3',
  programUuid: 'cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3',
  programName: 'programname',
  clientOrgUuid: 'cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3',
  organizationName: 'organizationname',
}

export const invalidSchool = {
  name: '',
  clientUuid: 'cdc9a77f-ac83-',
  klOrgUuid: 'cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3',
  programUuid: 'cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3',
  programName: 'programname',
  clientOrgUuid: 'cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3',
  organizationName: 'organizationname',
}

interface School {
  name: string
  clientUuid: string
  klOrgUuid: string
  programUuid: string
  programName: string
  clientOrgUuid: string
  organizationName: string
}

export const isSchoolValid = (school: School) => {
  try {
      const { error } = schoolSchema.validate(school);

      return !error;
  } catch (error) {
      return false;
  }
}
