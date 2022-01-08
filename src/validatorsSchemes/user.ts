import Joi from 'joi';
import { validationRules } from '../config/validationRules';

export const userSchema = Joi.object({
  OrganizationName: Joi.string()
    .min(validationRules.ORGANIZATION_NAME_MIN_LENGTH)
    .max(validationRules.ORGANIZATION_NAME_MAX_LENGTH)
    .required(),

  UserUUID: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required(),

  UserGivenName: Joi.string()
    .min(validationRules.USER_NAME_MIN_LENGTH)
    .max(validationRules.USER_NAME_MAX_LENGTH)
    .regex(validationRules.ALPHANUMERIC)
    .required(),

  UserFamilyName: Joi.string()
    .min(validationRules.USER_NAME_MIN_LENGTH)
    .max(validationRules.USER_NAME_MAX_LENGTH)
    .regex(validationRules.ALPHANUMERIC)
    .required(),

  Email: Joi.string().email().max(validationRules.EMAIL_MAX_LENGTH),

  Phone: Joi.string().regex(validationRules.PHONE_REGEX),

  DateOfBirth: Joi.string().regex(validationRules.DOB_REGEX),

  Gender: Joi.string()
    .regex(validationRules.ALPHANUMERIC)
    .min(validationRules.GENDER_MIN_LENGTH)
    .max(validationRules.GENDER_MAX_LENGTH)
    .required(),

  KLRoleName: Joi.array()
    .items(
      Joi.string()
        .regex(validationRules.ALPHANUMERIC)
        .max(validationRules.ROLE_NAME_MAX_LENGTH)
    )
    .min(1)
    .unique()
    .required(),

  SchoolName: Joi.string()
    .max(validationRules.SCHOOL_NAME_MIN_LENGTH)
    .max(validationRules.SCHOOL_NAME_MAX_LENGTH)
    .required(),

  ClassName: Joi.string()
    .min(validationRules.CLASS_NAME_MIN_LENGTH)
    .max(validationRules.CLASS_NAME_MAX_LENGTH)
    .required(),
}).or('Email', 'Phone');
