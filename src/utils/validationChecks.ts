import { 
  CLASS_VALIDATION_FAILED,
  SCHOOL_VALIDATION_FAILED, 
  INVALID_PROGRAM, 
  PROGRAM_NOT_EXIST, 
  SCHOOL_NOT_EXIST 
} from '../config/errorMessages';
import { school as schoolSchema } from '../validatorsSchemes';
import { classSchema } from '../validatorsSchemes';
import logger from './logging';
import { Prisma, PrismaClient } from '@prisma/client';
import { ValidationErrorItem } from 'joi';
import { arraysMatch } from './arraysMatch';

const prisma = new PrismaClient();

export const isSchoolValid = (school: Prisma.SchoolCreateInput) => {
  try {
    const { error, value } = schoolSchema.validate(school);

    error && logger.error({
      school: value,
      error: SCHOOL_VALIDATION_FAILED,
      validation: error.details.map((detail: ValidationErrorItem) =>  {
        return  { [detail.path.join()]: detail.message }
      }),
    });

    return !error;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

export const isSchoolProgramValid = async (
  programName: string,
  organizationUuid: string
) => {
  try {
    const programs = await prisma.program.count({
      where: {
        name: programName,
        clientOrgUuid: organizationUuid
      }
    });
    const isValid = programs > 0;

    !isValid &&
    logger.error({
      program: programName,
      organization: organizationUuid,
      error: PROGRAM_NOT_EXIST
    });

    return isValid;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

export const isClassValid = async (
  grade: Prisma.ClassCreateInput,
) => {
  try {
    const { error, value } = classSchema.validate(grade);
    error &&
    logger.error({
      class: value,
      error: CLASS_VALIDATION_FAILED,
      validation: error.details.map((detail: ValidationErrorItem) =>  {
        return  { [detail.path.join()]: detail.message }
       }),
    });

    return !error;
  } catch (error) {
    logger.error(error);
    return false;
  }
}

export const schoolExist = async (
  schoolName: string,
) => {
  try {
    const schools = await prisma.school.count({
      where: {
        name: schoolName,
      },
    });
    const exist = schools > 0;

    !exist &&
    logger.error({
      school: schoolName,
      messages: SCHOOL_NOT_EXIST,
    });

    return exist;
  } catch (error) {
    logger.error(error);
    return false;
  }
}

export const isClassProgramsValid = async (
  schoolName: string,
  classPrograms: Array<string>,
) => {
  try {
    const school = await prisma.school.findFirst({
      where: {
        name: schoolName,
      }
    });
  
    if (school) {
      const schoolPrograms = school.programNames;
      const validPrograms = arraysMatch(schoolPrograms, classPrograms);

      !validPrograms &&
      logger.error({
        programName: classPrograms.join(),
        error: INVALID_PROGRAM,
      });
  
      return validPrograms;
    } else {
      logger.error({
        school: schoolName,
        messages: SCHOOL_NOT_EXIST,
      });
      return false;
    }
  } catch (error) {
    logger.error(error);
    return false;
  }
}