import { ObjectSchema } from 'joi';
import { Category, Context, log } from '.';
import { Entity } from '../entities';
import { logError, ValidationError } from './errors';

export abstract class ProcessChain<T, V> {
  abstract data: T;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract schema: ObjectSchema<any>;
  abstract entity: Entity;

  abstract validate(): Promise<V>;
  abstract insertOne(item: V): Promise<void>;
  abstract process(): Promise<V>;

  abstract getEntityId(): string;

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
export async function validate<U, T extends ProcessChain<U, V>, V>(
  v: T
): Promise<U> {
  log.debug(`Attempting to validate ${v.entity}: ${v.getEntityId()}`);
  try {
    const { data, schema } = v;

    const { error } = schema.validate(data);
    if (error) throw error;

    const ctx = await Context.getInstance();

    // Make sure the organization name is valid
    if (!v.getOrganizationName) return data;
    const orgId = await ctx.getOrganizationClientId(v.getOrganizationName());

    // Make sure the school name is valid
    let schoolId = undefined;
    if (v.getSchoolName) {
      schoolId = await ctx.getSchoolClientId(orgId, v.getSchoolName());
    }

    let classId = undefined;
    if (v.getClassName) {
      if (!schoolId)
        throw logError(
          new ValidationError(v.entity, v.getEntityId(), [
            {
              path: `${orgId}.ERROR`,
              details: `Attempted to validate the class for entity ${v.entity} however no valid schoolId was found`,
            },
          ]),
          v.entity,
          v.getEntityId(),
          Category.C1_API
        );
      classId = await ctx.getClassClientId(v.getClassName(), orgId, schoolId);
    }

    if (v.getClasses) {
      if (!schoolId)
        throw logError(
          new ValidationError(v.entity, v.getEntityId(), [
            {
              path: `${orgId}.ERROR`,
              details: `Attempted to validate classes of entity ${v.entity} the  however no valid schoolId was found`,
            },
          ]),
          v.entity,
          v.getEntityId(),
          Category.C1_API
        );
      await ctx.classesAreValid(v.getClasses(), orgId, schoolId);
    }

    if (v.getPrograms) {
      await ctx.programsAreValid(v.getPrograms(), orgId, schoolId, classId);
    }

    if (v.getRoles) {
      await ctx.rolesAreValid(v.getRoles(), orgId);
    }

    log.debug(`Validation for ${v.entity}: ${v.getEntityId()} successful`);
    return data;
  } catch (error) {
    logError(error, v.entity, v.getEntityId(), Category.C1_API);
    throw error;
  }
}
