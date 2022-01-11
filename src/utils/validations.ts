import {
  isSchoolProgramValid,
  isSchoolValid,
  checkClassesValid,
} from './validationChecks';
import { MappedClass, MappedSchool } from './mapResKeys';
import { PrismaClient, School } from "@prisma/client";

export function validateSchool(school: MappedSchool) {
  if (isSchoolValid(school)) {
    if (school.programNames) {
      Object.values(school.programNames).forEach(async (program) => {
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
const prisma = new PrismaClient();
export async function validateSchools() {
  const schools: School[] = await prisma.school.findMany({
    where: {
      status: null
    }
  });
  for (const school of schools) {
    if (!isSchoolValid(school)) {
      await prisma.school.update({
        where: {
          id: school.id,
        },
        data: {
          status: 'invalid_data'
        }
      })
    } else {
      await prisma.school.update({
        where: {
          id: school.id,
        },
        data: {
          status: 'valid'
        }
      })
    }
  }
}

export async function validateClasses(
  classes: MappedClass[]
): Promise<boolean> {
  const classesValid = await checkClassesValid(classes);
  return classesValid;
}
