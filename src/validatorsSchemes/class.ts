import Joi from 'joi';
import messages from './messages';
import { validationRules } from '../config/validationRules';
import { stringInject } from '../../src/utils/string';

export const classSchema = Joi.object({
  name: Joi.string()
    .min(validationRules.CLASS_NAME_MIN_LENGTH)
    .max(validationRules.CLASS_NAME_MAX_LENGTH)
    .required()
    .messages({
      'string.base': stringInject(messages['string.base'], ['ClassName']) || '',
      'string.empty': stringInject(messages['string.empty'], ['ClassName']) || '',
      'string.min': stringInject(messages['string.min'], ['ClassName']) || '',
      'string.max': stringInject(messages['string.max'], ['ClassName']) || '',
    }),

  clientUuid: Joi.string()
    .guid()
    .required()
    .messages({
      'string.base': stringInject(messages['string.base'], ['ClassUUID']) || '',
      'string.empty': stringInject(messages['string.empty'], ['ClassUUID']) || '',
      'string.guid': stringInject(messages['string.guid'], ['ClassUUID']) || '',
    }),

  klOrgUuid: Joi.string()
    .guid()
    .required()
    .messages({
      'string.base': stringInject(messages['string.base'], ['KLOrgUUID']) || '',
      'string.guid': stringInject(messages['string.guid'], ['KLOrgUUID']) || '',
    }),

  shortCode: Joi.string()
    .max(validationRules.SHORT_CODE_MAX_LENGTH)
    .messages({
      'string.base': stringInject(messages['string.base'], ['ClassShortCode']) || '',
      'string.max': stringInject(messages['string.max'], ['ClassShortCode']) || '',
    }),

  schoolName: Joi.string()
    .min(validationRules.SCHOOL_NAME_MIN_LENGTH)
    // .max(validationRules.SCHOOL_NAME_MAX_LENGTH)
    .required()
    .messages({
      'string.base': stringInject(messages['string.base'], ['SchoolName']) || '',
      'string.empty': stringInject(messages['string.empty'], ['SchoolName']) || '',
      'string.min': stringInject(messages['string.min'], ['SchoolName']) || '',
      'string.max': stringInject(messages['string.max'], ['SchoolName']) || '',
    }),

  clientOrgUuid: Joi.string()
    .guid()
    .required()
    .messages({
      'string.base': stringInject(messages['string.base'], ['ClientOrgUUID']) || '',
      'string.guid': stringInject(messages['string.guid'], ['ClientOrgUUID']) || '',
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

  organizationName: Joi.string()
    .min(validationRules.ORGANIZATION_NAME_MIN_LENGTH)
    .max(validationRules.ORGANIZATION_NAME_MAX_LENGTH)
    .required()
    .messages({
      'string.base': stringInject(messages['string.base'], ['OrganizationName']) || '',
      'string.empty': stringInject(messages['string.empty'], ['OrganizationName']) || '',
      'string.min': stringInject(messages['string.min'], ['OrganizationName']) || '',
      'string.max': stringInject(messages['string.max'], ['OrganizationName']) || '',
    }),

  client: Joi.string().max(validationRules.CLIENT_MAX_LENGTH),

  errors: Joi.array().items(Joi.string()),

  status: Joi.string().max(validationRules.STATUS_MAX_LENGTH),
});
