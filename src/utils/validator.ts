import { ObjectSchema } from 'joi';
import { Context, log } from '.';
import { Entity } from '../entities';
import { logError } from './errors';

export interface Validator<T> {
  data: T;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: ObjectSchema<any>;
  entity: Entity;

  getEntityId(): string;

  getOrganizationName?(): string;
  getSchoolName?(): string;
  getClassName?(): string;
  getRoles?(): string[];
  getPrograms?(): string[];
  getClasses?(): string[];
}

/**
 * This function takes a type that implements `Validator` and runs a series
 * of validation functions based off the implementation of that interface.
 *
 * For each validation that you want to perform, the interface has to have the
 * optional getter methods implemented
 *
 * @param {U} v - The type that implements Validator<T>
 * @type {T} The actual data type being validated
 * @returns Type `T` the inner data that has successfully been validated
 * @throws if any of the validations fail
 */
export async function validate<U, T extends Validator<U>>(v: T): Promise<U> {
  log.debug(`Attempting to validate ${v.entity}: ${v.getEntityId()}`);
  try {
    const { data, schema } = v;

    const { error } = schema.validate(data);
    if (error) throw error;

    const ctx = await Context.getInstance();

    // @TODO - This doesn't currently validate that these
    // programs exist in a parent organization & parent school
    // it simply checks they're valid KidsLoop Program Names
    if (v.getPrograms) {
      ctx.programsAreValid(v.getPrograms());
    }

    if (v.getRoles) {
      ctx.rolesAreValid(v.getRoles());
    }

    // Make sure the organization name is valid
    if (!v.getOrganizationName) return data;
    const orgId = await ctx.getOrganizationClientId(v.getOrganizationName());

    // Make sure the school name is valid
    if (!v.getSchoolName) return data;
    const schoolId = await ctx.getSchoolClientId(orgId, v.getSchoolName());

    if (v.getClassName) {
      await ctx.getClassClientId(v.getClassName(), orgId, schoolId);
    }

    if (v.getClasses) {
      await ctx.classesAreValid(v.getClasses(), orgId, schoolId);
    }

    log.debug(`Validation for ${v.entity}: ${v.getEntityId()} successful`);
    return data;
  } catch (error) {
    logError(error, v.entity);
    throw error;
  }
}
