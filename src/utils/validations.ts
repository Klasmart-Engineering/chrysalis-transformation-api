import { isSchoolProgramValid, isSchoolValid } from "./validationChecks";
import { Prisma } from '@prisma/client';

export function validateSchool(school: Prisma.SchoolCreateInput) {
  if (isSchoolValid(school)) {
    if (school.programNames) {
      Object.values(school.programNames).forEach(async program => {
        return !await isSchoolProgramValid(String(program), String(school.klOrgUuid));
      })
    } else {
      return false;
    }
    return true;
  } else {
    return false;
  }
}
