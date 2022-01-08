import { ObjectSchema } from 'joi';
import { Context } from '.';
import { Entity } from '../entities';
import { logError } from './errors';

export interface Validator<T> {
  data: T;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: ObjectSchema<any>;
  entity: Entity;

  getOrganizationName?(): string;
  getSchoolName?(): string;
  getClassName?(): string;
  getRoles?(): string[];
  getPrograms?(): string[];
  getClasses?(): string[];
}

export async function validate<U, T extends Validator<U>>(v: T): Promise<U> {
  try {
    const { data, schema } = v;

    const { error } = schema.validate(data);
    if (error) throw error;

    const ctx = await Context.getInstance();

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

    return data;
  } catch (error) {
    logError(error, v.entity);
    throw error;
  }
}
