import Joi from 'joi';
import messages from './messages';
import { validationRules } from '../config/validationRules';
import { stringInject } from "../utils/string";

export const organizationSchema = Joi.object({
  OrganizationUUID: Joi.string()
    .guid()
    .required()
    .messages({
      'string.base': stringInject(messages['string.base'], ['OrganizationUUID']) || '',
      'string.empty': stringInject(messages['string.empty'], ['OrganizationUUID']) || '',
      'string.guid': stringInject(messages['string.guid'], ['OrganizationUUID']) || '',
    }),

  OrganizationName: Joi.string()
    .min(validationRules.ORGANIZATION_NAME_MIN_LENGTH)
    .max(validationRules.ORGANIZATION_NAME_MAX_LENGTH)
    .required()
    .messages({
      'string.base': stringInject(messages['string.base'], ['OrganizationName']) || '',
      'string.min': stringInject(messages['string.min'], ['OrganizationName']) || '',
      'string.max': stringInject(messages['string.max'], ['OrganizationName']) || '',
      'string.empty': stringInject(messages['string.empty'], ['OrganizationName']) || '',
    })
});
