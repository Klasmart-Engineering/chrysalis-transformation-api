import {
  CLASS_VALIDATION_FAILED,
  SCHOOL_VALIDATION_FAILED,
  INVALID_PROGRAM,
  PROGRAM_NOT_EXIST,
  SCHOOL_NOT_EXIST,
} from '../config/errorMessages';
import { schoolSchema } from '../validatorsSchemes';
import { classSchema } from '../validatorsSchemes';
import logger from './logging';
import Database from './database';
import { ValidationErrorItem } from 'joi';
import { arraysMatch } from './arraysMatch';
import { MappedClass, MappedSchool } from './mapResKeys';

export const isSchoolValid = (school: MappedSchool) => {
  try {
    const { error, value } = schoolSchema.validate(school, {
      abortEarly: false,
    });

    error &&
      logger.error({
        school: value,
        error: SCHOOL_VALIDATION_FAILED,
        validation: error.details.map((detail: ValidationErrorItem) => {
          return { [detail.path.join()]: detail.message };
        }),
      });

    return !error;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

export const isSchoolProgramValid = async (programName: string) => {
  try {
    const program = await Database.getProgramByName(programName);

    !program &&
      logger.error({
        programName: programName,
        error: PROGRAM_NOT_EXIST,
      });

    return !!program;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

export const schoolExist = async (schoolName: string) => {
  try {
    const school = await Database.getSchoolByName(schoolName);

    !school &&
      logger.error({
        school: schoolName,
        messages: SCHOOL_NOT_EXIST,
      });

    return !!school;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

export const isClassProgramsValid = async (
  schoolName: string,
  classPrograms: Array<string>
) => {
  try {
    const school = await Database.getSchoolByName(schoolName);

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
};

export const isClassValid = (schoolClass: MappedClass) => {
  try {
    const { error, value } = classSchema.validate(schoolClass, {
      abortEarly: false,
    });

    error &&
      logger.error({
        class: value,
        error: CLASS_VALIDATION_FAILED,
        validation: error.details.map((detail: ValidationErrorItem) => {
          return { [detail.path.join()]: detail.message };
        }),
      });

    return !error;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

export const checkClassesValid = async (classes: MappedClass[]) => {
  try {
    if (!classes || classes.length === 0) {
      return false;
    }

    // TODO: check if organization exists when db organization schema available
    // const orgName = classes[0].organizationName;

    const schoolName = classes[0].schoolName;
    const school = await Database.getSchoolByName(schoolName);

    if (!school) {
      logger.error(`School named "${schoolName}" doesn't exist in CIL db.`);
      return false;
    }

    let classesHaveValidSchema = true;

    for (const cl of classes) {
      cl.clientUuid = school.clientUuid;
      const { error, value } = classSchema.validate(cl, { abortEarly: false });

      if (error) {
        const errorDetails = error.details.map(
          (detail: { message: string }) => detail.message
        );
        logger.error(JSON.stringify({ class: value, messages: errorDetails }));
        classesHaveValidSchema = false;
      }
    }

    return classesHaveValidSchema;
  } catch (error) {
    logger.error(error);
    return false;
  }
};
