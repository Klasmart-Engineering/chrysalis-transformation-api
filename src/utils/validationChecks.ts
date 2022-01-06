import { PROGRAM_NOT_EXIST, SCHOOL_VALIDATION_FAILED } from '../config/errorMessages';
import { school as schoolSchema } from '../validatorsSchemes';
import logger from './logging';
import { Prisma, PrismaClient } from '@prisma/client';
import { ValidationErrorItem } from 'joi';

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
