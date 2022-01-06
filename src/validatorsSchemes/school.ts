import Joi from "joi";
import { validationRules } from "../config/validationRules";

export const school = Joi.object({
  name: Joi.string()
    .min(validationRules.SCHOOL_NAME_MIN_LENGTH)
    .max(validationRules.SCHOOL_NAME_MAX_LENGTH)
    .required(),

  clientUuid: Joi.string()
    .guid()
    .required(),

  klOrgUuid: Joi.string()
    .guid(),

  programNames: Joi.array()
    .items(Joi.string()
      .min(validationRules.PROGRAM_NAME_MIN_LENGTH)
      .max(validationRules.PROGRAM_NAME_MAX_LENGTH))
    .required(),

  clientOrgUuid: Joi.string()
    .guid(),

  organizationName: Joi.string()
    .min(validationRules.ORGANIZATION_NAME_MIN_LENGTH)
    .max(validationRules.ORGANIZATION_NAME_MAX_LENGTH)
    .required(),

  shortCode: Joi.string()
});
