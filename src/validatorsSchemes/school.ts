import Joi from 'joi';
import messages from './messages';
import { validationRules } from '../config/validationRules';
import { stringInject } from '../../src/utils/string';

export const schoolSchema = Joi.object({
  name: Joi.string()
    .min(validationRules.SCHOOL_NAME_MIN_LENGTH)
    // .max(validationRules.SCHOOL_NAME_MAX_LENGTH)
    .required()
    .messages({
      'string.base': stringInject(messages['string.base'], ['SchoolName']) || '',
      'string.empty': stringInject(messages['string.empty'], ['SchoolName']) || '',
      'string.min': stringInject(messages['string.min'], ['SchoolName']) || '',
      'string.max': stringInject(messages['string.max'], ['SchoolName']) || '',
    }),

  clientUuid: Joi.string()
    .guid()
    .required()
    .messages({
      'string.base': stringInject(messages['string.base'], ['SchoolUUID']) || '',
      'string.empty': stringInject(messages['string.empty'], ['SchoolUUID']) || '',
      'string.guid': stringInject(messages['string.guid'], ['SchoolUUID']) || '',
    }),

  klOrgUuid: Joi.string()
    .guid()
    .messages({
      'string.base': stringInject(messages['string.base'], ['KLOrgUUID']) || '',
      'string.guid': stringInject(messages['string.guid'], ['KLOrgUUID']) || '',
    }),

  programNames: Joi.array()
    .items(
      Joi.string()
        .min(validationRules.PROGRAM_NAME_MIN_LENGTH)
        .max(validationRules.PROGRAM_NAME_MAX_LENGTH)
        .messages({
          'string.base': stringInject(messages['string.base'], ['ProgramName']) || '',
          'string.min': stringInject(messages['string.min'], ['ProgramName']) || '',
          'string.max': stringInject(messages['string.max'], ['ProgramName']) || '',
        })
    )
    .required()
    .messages({
      'string.empty': stringInject(messages['string.empty'], ['ProgramName']) || '',
    }),

  clientOrgUuid: Joi.string()
    .guid()
    .messages({
      'string.base': stringInject(messages['string.base'], ['ClientOrgUUID']) || '',
      'string.guid': stringInject(messages['string.guid'], ['ClientOrgUUID']) || '',
    }),

  organizationName: Joi.string()
    .min(validationRules.ORGANIZATION_NAME_MIN_LENGTH)
    .max(validationRules.ORGANIZATION_NAME_MAX_LENGTH)
    .required()
    .messages({
      'string.base': stringInject(messages['string.base'], ['OrganizationName']) || '',
      'string.min': stringInject(messages['string.min'], ['OrganizationName']) || '',
      'string.max': stringInject(messages['string.max'], ['OrganizationName']) || '',
      'string.empty': stringInject(messages['string.empty'], ['OrganizationName']) || '',
    }),

  shortCode: Joi.string()
    .max(validationRules.SHORT_CODE_MAX_LENGTH)
    .messages({
      'string.base': stringInject(messages['string.base'], ['SchoolShortCode']) || '',
      'string.max': stringInject(messages['string.max'], ['SchoolShortCode']) || '',
    }),
});
