import Joi from 'joi';
import { validationRules } from '../config/validationRules';

export const classSchema = Joi.object({
  name: Joi.string()
    .min(validationRules.CLASS_NAME_MIN_LENGTH)
    .max(validationRules.CLASS_NAME_MAX_LENGTH)
    .required(),

  clientUuid: Joi.string()
  .guid({ version: ['uuidv4'] })
  .required(),

  klOrgUuid: Joi.string()
  .guid({ version: ['uuidv4'] })
  .required(),

  shortCode: Joi.string().max(validationRules.CLASS_SHORT_CODE_MAX_LENGTH),

  schoolName: Joi.string()
    .max(validationRules.SCHOOL_NAME_MIN_LENGTH)
    .max(validationRules.SCHOOL_NAME_MAX_LENGTH)
    .required(),

  clientOrgUuid: Joi.string()
  .guid({ version: ['uuidv4'] })
  .required(),

  programNames: Joi.array()
    .items(
      Joi.string()
        .min(validationRules.PROGRAM_NAME_MIN_LENGTH)
        .max(validationRules.PROGRAM_NAME_MAX_LENGTH)
    )
    .required(),

  client: Joi.string().max(validationRules.CLIENT_MAX_LENGTH),

  errors: Joi.array().items(Joi.string()),

  status: Joi.string().max(validationRules.STATUS_MAX_LENGTH),

  organizationName: Joi.string()
    .min(validationRules.ORGANIZATION_NAME_MIN_LENGTH)
    .max(validationRules.ORGANIZATION_NAME_MAX_LENGTH)
    .required(),
});
