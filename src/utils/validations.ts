import {
  isSchoolProgramValid,
  isSchoolValid,
  checkClassesValid,
} from './validationChecks';
import { MappedClass, MappedSchool } from './mapResKeys';

export function validateSchool(school: MappedSchool) {
  if (isSchoolValid(school)) {
    if (school.programName) {
      Object.values(school.programName).forEach(async (program) => {
        return !(await isSchoolProgramValid(program));
      });
    } else {
      return false;
    }

    return true;
  } else {
    return false;
  }
}

export async function validateClasses(
  classes: MappedClass[]
): Promise<boolean> {
  const classesValid = await checkClassesValid(classes);
  return classesValid;
}
