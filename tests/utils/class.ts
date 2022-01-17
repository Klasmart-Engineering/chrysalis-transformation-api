import { classSchema } from '../../src/validatorsSchemes';

export const validClass = {
  name: 'Grade 3 A',
  clientUuid: 'cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3',
  klOrgUuid: 'cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3',
  shortCode: 'SHCODE',
  schoolName: 'Example School',
  programNames: ['Program Grade 3'],
  clientOrgUuid: 'cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3',
  organizationName: 'Org Classic',
};

export const invalidClass = {
  name: '',
  clientUuid: 'cdc9a77f-ac83-',
  klOrgUuid: 'cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3',
  shortCode: 'SHORTCODE17LENGTH',
  schoolName: '2134',
  programNames: [],
  clientOrgUuid: 'cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3',
  organizationName: 'Org named X',
};

interface Class {
  name: string;
  clientUuid: string;
  klOrgUuid: string;
  shortCode: string;
  schoolName: string;
  programNames: string[];
  clientOrgUuid: string;
  organizationName: string;
}

export const isClassValid = (classData: Class) => {
  try {
    const { error } = classSchema.validate(classData, { abortEarly: false });
    return !error;
  } catch (error) {
    return false;
  }
};
