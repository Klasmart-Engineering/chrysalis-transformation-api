import { classSchema } from '../../src/validations/c1';

export const validClass = {
  ClassUUID: 'cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3',
  ClassName: 'Grade 3 A',
  ClassShortCode: 'SHCODE',
  OrganizationName: 'Org Classic',
  // OrganizationUUID: 'cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3',
  SchoolName: 'Example School',
  // SchoolUUID: 'cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3',
  ProgramName: ['Program Grade 3'],
};

export const invalidClass = {
  ClassUUID: 'cdc9a77f-ac83-',
  ClassName: '',
  ClassShortCode: 'SHORTCODE17LENGTH',
  OrganizationName: 'Org named X',
  // OrganizationUUID: 'cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3',
  SchoolName: '2134',
  // SchoolUUID: 'cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3',
  ProgramName: [],
};

interface Class {
  ClassUUID: string;
  ClassName: string;
  ClassShortCode: string;
  OrganizationName: string;
  // OrganizationUUID: string;
  SchoolName: string;
  // SchoolUUID: string;
  ProgramName: string[];
}

export const isClassValid = (classData: Class) => {
  try {
    const { error } = classSchema.validate(classData, { abortEarly: false });
    return !error;
  } catch (error) {
    return false;
  }
};
