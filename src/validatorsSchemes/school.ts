import Joi from 'joi';
import { validationRules } from '../config/validationRules';

export const school = Joi.object({
    name: Joi.string()
        .alphanum()
        .min(validationRules.SCHOOL_NAME_MIN_LENGTH)
        .max(validationRules.SCHOOL_NAME_MAX_LENGTH)
        .required(),

    clientUuid: Joi.string()
        .guid()
        .required(),
    
    klOrgUuid: Joi.string()
        .guid()
        .required(),

    programUuid: Joi.string()
        .guid()
        .required(),
    
    programName: Joi.string()
        .alphanum()
        .min(validationRules.PROGRAM_NAME_MIN_LENGTH)
        .max(validationRules.PROGRAM_NAME_MAX_LENGTH)
        .required(),

    clientOrgUuid: Joi.string()
        .guid()
        .required(),

    organizationName: Joi.string()
        .alphanum()
        .min(validationRules.ORGANIZATION_NAME_MIN_LENGTH)
        .max(validationRules.ORGANIZATION_NAME_MAX_LENGTH)
        .required(),
});