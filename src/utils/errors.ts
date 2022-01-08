import { ValidationError as JoiError } from 'joi';
import { ClientUuid, log } from '.';
import { Feedback, ToFeedback } from './feedback';
import { Entity } from '../entities';

export type ValidateError = {
  path: string;
  details: string;
};

export abstract class AppError implements ToFeedback {
  public abstract isRetriable: boolean;
  protected hasBeenLogged = false;

  constructor(
    public readonly entity: Entity,
    public readonly entityId: ClientUuid
  ) {}

  public abstract toFeedback(): Feedback;
  public abstract log(): void;
}

export class ValidationError extends AppError {
  public isRetriable = false;

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

  public toFeedback(): Feedback {
    return {
      UUID: this.entityId,
      Entity: this.entityId,
      HasSuccess: false,
      ErrorMessage: JSON.stringify(this.errors),
    };
  }

  public log(): void {
    if (this.hasBeenLogged) return;
    log.error(`Validation error for entity: ${this.entity}`, {
      error: 'Validation error',
      entity: this.entity,
      id: this.entityId,
      details: this.errors,
      retriable: this.isRetriable,
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
  public isRetriable = false;

  constructor(
    public readonly entity: Entity,
    public readonly entityName: string,
    public details?: InvalidEntityOpts,
    public readonly entityId: string = 'INVALID'
  ) {
    super(entity, entityId);
  }

  public toFeedback(): Feedback {
    return {
      UUID: this.entityId,
      Entity: this.entity,
      HasSuccess: false,
      ErrorMessage: `Tried to look up entity: ${this.entity} using the entity name: ${this.entityName} however no valid mapping was found`,
    };
  }

  public log(): void {
    if (this.hasBeenLogged) return;
    log.error(
      `Tried to look-up entity ${this.entity} using name ${this.entityName}, however no valid entity was found`,
      {
        error: 'Entity not found',
        entity: this.entity,
        retriable: this.isRetriable,
        ...this.details,
      }
    );
    this.hasBeenLogged = true;
  }
}

/**
 * A helper function to log the error appropriately before
 * re-throwing it
 *
 * @param {any} error - The error that was thrown
 * @param {Entity} entity - The entity that was being processed while this failed
 * @throws This function will always throw an error
 */
export function logError(error: unknown, entity?: Entity): void {
  if (Array.isArray(error)) {
    for (const e of error) {
      logError(e, entity);
    }
    throw error;
  }

  if (error instanceof AppError) {
    error.log();
  } else {
    log.error(`Unknown error occurred for entity: ${entity}`, { error });
  }

  throw error;
}
