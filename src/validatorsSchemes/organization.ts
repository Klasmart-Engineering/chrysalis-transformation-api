import Joi from 'joi';
import { validationRules } from '../config/validationRules';

export const organizationSchema = Joi.object({
  OrganizationName: Joi.string()
    .min(validationRules.ORGANIZATION_NAME_MIN_LENGTH)
    .max(validationRules.ORGANIZATION_NAME_MAX_LENGTH)
    .required(),

  OrganizationUUID: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required(),
});
