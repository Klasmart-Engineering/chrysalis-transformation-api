import Joi from 'joi';

export const onboardClassesSchema = Joi.object({
  // Won't use custom error messages here because only us (KidsLoop) can see these
  schoolId: Joi.string().guid().required(),
  classIds: Joi.array().items(Joi.string().guid()),
});
