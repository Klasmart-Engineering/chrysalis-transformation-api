import { ValidationError as JoiError } from 'joi';
import { ClientUuid, log } from '.';
import { Entity } from '../entities';

export enum Category {
  APP = 'App',
  REDIS = 'Redis',
  POSTGRES = 'Postgres',
  ADMIN_SERVICE = 'Admin Service',
  C1_API = 'C1 API',
  UNKNOWN = 'Unknown',
}

export type ValidateError = {
  path: string;
  details: string;
};

export abstract class AppError {
  public abstract isRetriable: boolean;
  protected hasBeenLogged = false;
  public abstract category: Category;

  constructor(
    public readonly entity: Entity,
    public readonly entityId: ClientUuid
  ) {}

  public abstract toFeedback(): string;
  public abstract log(props?: object): void;
}

export class ValidationError extends AppError {
  public readonly isRetriable = false;
  public readonly category = Category.APP;

  constructor(
    public readonly entity: Entity,
    public readonly entityId: string,
    private errors: ValidateError[]
  ) {
    super(entity, entityId);
  }

  public static fromJoiError(
    error: JoiError,
    entity: Entity,
    entityId: string
  ): ValidationError {
    const errors: ValidateError[] = [];
    for (const e of error.details) {
      errors.push({
        path: e.path.join('.'),
        details: `${e.type}: ${e.message}`,
      });
    }
    return new ValidationError(entity, entityId, errors);
  }

  public toFeedback(): string {
    return JSON.stringify(this.errors);
  }

  public log(props?: object): void {
    if (this.hasBeenLogged) return;
    log.error(`Validation error for entity: ${this.entity}`, {
      error: 'Validation error',
      entity: this.entity,
      id: this.entityId,
      details: this.errors,
      retriable: this.isRetriable,
      category: this.category,
      ...props,
    });
    this.hasBeenLogged = true;
  }
}

export type InvalidEntityOpts = {
  organizationId?: ClientUuid;
  schoolId?: ClientUuid;
  classId?: ClientUuid;
};

export class InvalidEntityNameError extends AppError {
  public readonly isRetriable = false;
  public readonly category = Category.APP;

  constructor(
    public readonly entity: Entity,
    public readonly entityName: string,
    public details?: InvalidEntityOpts,
    public readonly entityId: string = 'INVALID'
  ) {
    super(entity, entityId);
  }

  public toFeedback(): string {
    return `Tried to look up entity: ${this.entity} using the entity name: ${this.entityName} however no valid mapping was found`;
  }

  public log(props?: object): void {
    if (this.hasBeenLogged) return;
    log.error(
      `Tried to look-up entity ${this.entity} using name ${this.entityName}, however no valid entity was found`,
      {
        error: 'Entity not found',
        entity: this.entity,
        retriable: this.isRetriable,
        category: this.category,
        ...this.details,
        ...props,
      }
    );
    this.hasBeenLogged = true;
  }
}

export class UnexpectedError extends AppError {
  public readonly isRetriable = false;
  public readonly category = Category.UNKNOWN;

  constructor(
    public readonly entity: Entity,
    public readonly entityName: string,
    public readonly entityId: string
  ) {
    super(entity, entityId);
  }

  private generateErrorMessage(): string {
    let msg = `An unexpected error occurred when attempting to process ${this.entity}.`;
    if (this.entityName.length > 0) {
      msg += `Name: ${this.entityName} |`;
    }
    if (this.entityId.length > 0) {
      msg += `ID: ${this.entityId}`;
    }
    return msg;
  }

  public toFeedback(): string {
    return this.generateErrorMessage();
  }

  public log(opts?: object): void {
    if (this.hasBeenLogged) return;
    log.error('An unexpected error occurred', {
      error: this.generateErrorMessage(),
      entity: this.entity,
      retriable: this.isRetriable,
      catergory: this.category,
      ...opts,
    });
    this.hasBeenLogged = true;
  }
}

export class WrappedError extends AppError {
  public readonly category = Category.UNKNOWN;
  public readonly error: string | unknown;
  public readonly isRetriable = false;

  constructor(
    error: unknown,
    public readonly msg: string,
    public readonly entity: Entity,
    public readonly entityId: string
  ) {
    super(entity, entityId);
    error instanceof Error
      ? (this.error = `${error.name}: ${error.message}`)
      : (this.error = error);
  }

  public toFeedback(): string {
    return 'An unexpected error occurred';
  }

  public log(opts?: object): void {
    if (this.hasBeenLogged) return;
    log.error(this.msg, {
      error: this.error,
      entity: this.entity,
      retriable: this.isRetriable,
      catergory: this.category,
      ...opts,
    });
    this.hasBeenLogged = true;
  }
}

/**
 * A helper function to log the error appropriately before
 * re-throwing it
 *
 * @param {unknown} error - The error that was thrown
 * @param {Entity} entity - The entity that was being processed while this failed
 * @param {string} entityID - The ID of the entity that was being processed while this failed
 * @param {Category} category - The category of the error
 * @param {object} addt - Additional Properties for the log
 * @param {string} addt.msg - A custom error message
 * @param {object} addt.props - Additional key-value pairs to inject into the
 * log message
 */
export function logError(
  error: unknown,
  entity: Entity,
  entityId: ClientUuid,
  category: Category = Category.APP,
  addt?: {
    msg?: string;
    props?: object;
  }
): AppError | AppError[] {
  if (Array.isArray(error)) {
    let errs: AppError[] = [];
    for (const e of error) {
      const errors = logError(e, entity, entityId, category, addt);
      if (Array.isArray(errors)) {
        errs = errs.concat(errors);
      } else {
        errs.push(errors);
      }
    }
    return errs;
  }

  const { props } = addt || {};

  if (error instanceof AppError) {
    error.log(props);
    return error;
  }
  const msg =
    addt?.msg ||
    `Unknown error occurred for entity: ${entity}, id: ${entityId}`;
  const e = new WrappedError(error, msg, entity, entityId);
  e.log(props);
  return e;
}
