import { Uuid } from '.';
import { Entity } from '../entities';

type Json = string;

export interface IMessage {
  entity: Entity;
  entityId: Uuid;

  requestTrace: Uuid;
  attempts: number;
  cascade: boolean;
  fullMigration?: boolean;
}

export class Message {
  constructor(
    public readonly entity: Entity,
    public readonly entityId: Uuid,
    public readonly requestTrace: Uuid,
    public readonly attempts: number,
    public readonly cascade: boolean,
    public readonly fullMigration = false,
    public readonly redisMessage?: string
  ) {}

  public static parse(data: Json, redisMessageId?: string): Message {
    const {
      entity,
      entityId,
      requestTrace,
      attempts,
      cascade,
      fullMigration,
    }: IMessage = JSON.parse(data);
    return new Message(
      entity,
      entityId,
      requestTrace,
      attempts,
      cascade,
      fullMigration,
      redisMessageId
    );
  }

  public toJson(): Json {
    return JSON.stringify({
      entity: this.entity,
      entityId: this.entityId,
      requestTrace: this.requestTrace,
      attempts: this.attempts,
      cascade: this.cascade,
      fullMigration: this.fullMigration,
    } as IMessage);
  }
}
