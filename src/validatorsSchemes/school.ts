import Joi from 'joi';
import { validationRules } from '../config/validationRules';

export const schoolSchema = Joi.object({
  id: Joi.number(),

  klUuid: Joi.string().allow(null).guid(),

  status: Joi.string().allow(null),

  createdAt: Joi.date(),

  updatedAt: Joi.date(),

  deletedAt: Joi.date().allow(null),

  name: Joi.string()
    .min(validationRules.SCHOOL_NAME_MIN_LENGTH)
    .max(validationRules.SCHOOL_NAME_MAX_LENGTH)
    .required(),

  clientUuid: Joi.string().guid().required(),

  klOrgUuid: Joi.string().allow(null).guid(),

  programNames: Joi.array()
    .items(
      Joi.string()
        .min(validationRules.PROGRAM_NAME_MIN_LENGTH)
        .max(validationRules.PROGRAM_NAME_MAX_LENGTH)
    )
    .required(),

  clientOrgUuid: Joi.string().allow(null).guid(),

  organizationName: Joi.string()
    .min(validationRules.ORGANIZATION_NAME_MIN_LENGTH)
    .max(validationRules.ORGANIZATION_NAME_MAX_LENGTH)
    .required(),

  shortCode: Joi.string(),

});
