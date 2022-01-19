import Joi from 'joi';
import { validationRules } from '../config/validationRules';
import { stringInject } from "../utils/string";
import messages from './messages';

export const userSchema = Joi.object({

  userUuid: Joi.string().required().guid()
    .messages({
      'string.base': stringInject(messages['string.base'], ['UserUUID']) || '',
      'string.empty': stringInject(messages['string.empty'], ['UserUUID']) || '',
      'string.guid': stringInject(messages['string.guid'], ['UserUUID']) || '',
    }),

  klUuid: Joi.string().guid().allow(null)
    .messages({
      'string.base': stringInject(messages['string.base'], ['KlUuid']) || '',
      'string.guid': stringInject(messages['string.guid'], ['KlUuid']) || '',
    }),

  email: Joi.string().allow(null)
    .regex(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
    .max(validationRules.EMAIL_MAX_LENGTH)
    .messages({
      'string.base': stringInject(messages['string.base'], ['Email']) || '',
      'string.max': stringInject(messages['string.max'], ['Email']) || '',
      'string.pattern.base': stringInject(messages['string.regex'], ['Email']) || '',
    }),

  phone: Joi.string().allow(null)
    .regex(/^\+[1-9]\d{1,14}$/)
    .messages({
      'string.base': stringInject(messages['string.base'], ['Phone']) || '',
      'string.pattern.base': stringInject(messages['string.regex'], ['Phone']) || '',
    }),

  username: Joi.string()
    .required()
    .max(validationRules.USERNAME_MAX_LENGTH)
    .messages({
      'string.base': stringInject(messages['string.base'], ['Username']) || '',
      'string.empty': stringInject(messages['string.empty'], ['Username']) || '',
      'string.max': stringInject(messages['string.max'], ['Username']) || '',
    }),

  userGivenName: Joi.string()
    .required()
    .regex(/^[\p{L}\d .'&/,-]*$/u)
    .messages({
      'string.base': stringInject(messages['string.base'], ['UserGivenName']) || '',
      'string.empty': stringInject(messages['string.empty'], ['UserGivenName']) || '',
      'string.pattern.base': stringInject(messages['string.regex'], ['UserGivenName']) || '',
    }),

  userFamilyName: Joi.string()
    .required()
    .regex(/^[\p{L}\d .'&/,-]*$/u)
    .messages({
      'string.empty': stringInject(messages['string.empty'], ['UserFamilyName']) || '',
      'string.base': stringInject(messages['string.base'], ['UserFamilyName']) || '',
      'string.pattern.base': stringInject(messages['string.regex'], ['UserFamilyName']) || '',
    }),

  dateOfBirth: Joi.string().allow(null)
    .regex(/^(((0)[0-9])|((1)[0-2]))(-)\d{4}$/)
    .messages({
      'string.base': stringInject(messages['string.base'], ['DateOfBirth']) || '',
      'string.pattern.base': stringInject(messages['string.regex'], ['DateOfBirth']) || '',
    }),

  gender: Joi.string()
    .required()
    .min(validationRules.GENDER_MIN_LENGTH)
    .max(validationRules.GENDER_MAX_LENGTH)
    .messages({
      'string.base': stringInject(messages['string.base'], ['Gender']) || '',
      'string.empty': stringInject(messages['string.empty'], ['Gender']) || '',
      'string.min': stringInject(messages['string.min'], ['Gender']) || '',
      'string.max': stringInject(messages['string.max'], ['Gender',]) || '',
    }),

  klRoleName: Joi.array()
    .required()
    .items(
      Joi.string()
        .max(validationRules.ROLE_NAME_MAX_LENGTH)
        .messages({
          'string.base': stringInject(messages['string.base'], ['KLRoleName']) || '',
          'string.max': stringInject(messages['string.max'], ['KLRoleName']) || '',
        }),
    )
    .messages({
      'string.empty': stringInject(messages['string.empty'], ['KLRoleName']) || '',
    }),

  schoolName: Joi.string()
    .required()
    .min(validationRules.SCHOOL_NAME_MIN_LENGTH)
    .max(validationRules.SCHOOL_NAME_MAX_LENGTH)
    .messages({
      'string.base': stringInject(messages['string.base'], ['SchoolName']) || '',
      'string.empty': stringInject(messages['string.empty'], ['SchoolName']) || '',
      'string.min': stringInject(messages['string.min'], ['SchoolName']) || '',
      'string.max': stringInject(messages['string.max'], ['SchoolName']) || '',
    }),

  className: Joi.array()
    .items(
      Joi.string()
        .min(validationRules.CLASS_NAME_MIN_LENGTH)
        .max(validationRules.CLASS_NAME_MAX_LENGTH)
        .messages({
          'string.base': stringInject(messages['string.base'], ['ClassName']) || '',
          'string.min': stringInject(messages['string.min'], ['ClassName']) || '',
          'string.max': stringInject(messages['string.max'], ['ClassName']) || ''
        }),
    )
    .required()
    .messages({
      'string.empty': stringInject(messages['string.empty'], ['ClassName']) || '',
    }),
});
