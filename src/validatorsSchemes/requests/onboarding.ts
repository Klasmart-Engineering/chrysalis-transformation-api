import Joi from 'joi';

export const onboardingSchema = Joi.object({
  organizationName: Joi.string().required(),
  schoolName: Joi.string().required(),
});
