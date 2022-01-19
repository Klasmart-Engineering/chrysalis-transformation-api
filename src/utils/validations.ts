import { ClassQuerySchema, OrganizationQuerySchema, SchoolQuerySchema } from '../interfaces/clientSchemas';
import {
  CLASS_VALIDATION_FAILED,
  SCHOOL_VALIDATION_FAILED,
} from '../config/errorMessages';
import { organizationSchema, schoolSchema } from '../validatorsSchemes';
import { classSchema } from '../validatorsSchemes';
import logger from './logging';
import { ValidationErrorItem } from 'joi';
import { FailedResponseType } from './types';

export type ValidationResponseType = {
  validData?: (OrganizationQuerySchema | SchoolQuerySchema | ClassQuerySchema)[],
  errors?: FailedResponseType[]
}

export const isSchoolValid = (school: SchoolQuerySchema) => {
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

export const isClassValid = (schoolClass: ClassQuerySchema) => {
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

export function validateOrganizations(organizations: OrganizationQuerySchema[]): ValidationResponseType {
  const response: ValidationResponseType = {};

  for (const org of organizations) {
    const { error, value } = organizationSchema.validate(org, { abortEarly: false });

    if (error) {
      const validationErrMsg = error.details.map((detail: ValidationErrorItem) => {
        const { message, context } = detail;

        const validationError: FailedResponseType = {
          msg: message,
          value: context?.value || '',
          param: context?.key || '',
          entity: 'organization',
          uuid: org.OrganizationUUID
        };

        if (response.errors) {
          response.errors.push(validationError);
        } else {
          response.errors = [validationError];
        }

        return validationError;
      });

      logger.error({
        initialOrganization: value,
        error: SCHOOL_VALIDATION_FAILED,
        validation: validationErrMsg,
      });
    } else {
      if (response.validData) {
        response.validData.push(org);
      } else {
        response.validData = [org];
      }
    }
  }

  return response;
}

export function validateSchools(schools: SchoolQuerySchema[]): ValidationResponseType {
  const response: ValidationResponseType = {};

  for (const school of schools) {
    const { error, value } = schoolSchema.validate(school, { abortEarly: false });

    if (error) {
      logger.error({
        school: value,
        error: SCHOOL_VALIDATION_FAILED,
        validation: error.details.map((detail: ValidationErrorItem) => {
          return { [detail.path.join()]: detail.message };
        }),
      });

    }
  }

  return response;
}

export function validateClasses(classes: ClassQuerySchema[]): ValidationResponseType {
  const response: ValidationResponseType = {};

  for (const cl of classes) {
    const { error, value } = classSchema.validate(cl, { abortEarly: false });

    if (error) {
      logger.error({
        class: value,
        error: CLASS_VALIDATION_FAILED,
        validation: error.details.map((detail: ValidationErrorItem) => {
          return { [detail.path.join()]: detail.message };
        }),
      });

    }
  }

  return response;
}
