import Joi from 'joi';
import { validationRules } from '../config/validationRules';

export const classSchema = Joi.object({
  OrganizationName: Joi.string()
    .min(validationRules.ORGANIZATION_NAME_MIN_LENGTH)
    .max(validationRules.ORGANIZATION_NAME_MAX_LENGTH)
    .required(),

  ClassUUID: Joi.string().guid({ version: ['uuidv4'] }),

  ClassName: Joi.string()
    .min(validationRules.SCHOOL_NAME_MIN_LENGTH)
    .max(validationRules.SCHOOL_NAME_MAX_LENGTH)
    .required(),

  ClassShortCode: Joi.string()
    .max(validationRules.SHORTCODE_MAX_LENGTH)
    .required(),

  ProgramName: Joi.array()
    .items(
      Joi.string()
        .min(validationRules.PROGRAM_NAME_MIN_LENGTH)
        .max(validationRules.PROGRAM_NAME_MAX_LENGTH)
    )
    .min(1)
    .unique()
    .required(),

  SchoolName: Joi.string()
    .min(validationRules.SCHOOL_NAME_MIN_LENGTH)
    .max(validationRules.SCHOOL_NAME_MAX_LENGTH)
    .required(),
});
