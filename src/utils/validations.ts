import { isSchoolProgramValid, isSchoolValid } from "./validationChecks";
import { MappedSchool } from "./mapResKeys";

export function validateSchool(school: MappedSchool) {
  if (isSchoolValid(school)) {
    school.programName.forEach(async program => {
      return !await isSchoolProgramValid(program, school.klOrgUuid);
    })
    return true;
  } else {
    return false;
  }
}
