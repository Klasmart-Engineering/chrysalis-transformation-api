import R from 'ioredis';
import { log, Uuid } from '.';
import { Message } from './message';
import { v4 as uuidv4 } from 'uuid';

export class Redis {
  private static _instance: Redis;
  private consumerId: Uuid;
  public static readonly TECHNOLOGY = 'REDIS';

  private constructor(
    private redis: R.Redis | R.Cluster,
    private stream: string,
    private consumerGroup: string
  ) {
    this.consumerId = uuidv4();
  }

  public static async initialize(): Promise<Redis> {
    if (this._instance) return this._instance;
    log.info('Attempting to initialize Redis stream');
    checkEnvVars();

    const client = await Redis.createClient();
    const stream = process.env.REDIS_STREAM_NAME!;
    const consumerGroup = process.env.REDIS_CONSUMER_GROUP_NAME!;
    try {
      const streamInfo = await client.xinfo('GROUPS', stream);
      for (const i of streamInfo) {
        if (!(i as string[]).includes(consumerGroup)) {
          await client.xgroup('CREATE', stream, consumerGroup, 0, 'MKSTREAM');
        }
      }
    } catch (e) {
      if (e instanceof Error && e.message === 'ERR no such key') {
        await client.xgroup('CREATE', stream, consumerGroup, 0, 'MKSTREAM');
      }
      log.error('Error occured while attempting to initialize stream', {
        error: e,
        technology: Redis.TECHNOLOGY,
      });
    }
    log.info('Succesfully initialized Redis stream');
    return new Redis(client, stream, consumerGroup);
  }

  public static async createClient(): Promise<R.Redis | R.Cluster> {
    const redisMode = process.env.REDIS_MODE ?? `NODE`;
    const port = Number(process.env.REDIS_PORT) || undefined;
    const host = process.env.REDIS_HOST;
    const password = process.env.REDIS_PASSWORD;
    const lazyConnect = true;

    let redis: R.Redis | R.Cluster;
    if (redisMode === `CLUSTER`) {
      redis = new R.Cluster(
        [
          {
            port,
            host,
          },
        ],
        {
          lazyConnect,
          redisOptions: {
            password,
          },
        }
      );
    } else {
      redis = new R(port, host, {
        lazyConnect: true,
        password,
      });
    }
    await redis.connect();
    return redis;
  }

  public async publishMessage(m: Message): Promise<void> {
    try {
      const payload = m.toJson();
      await this.redis.xadd(this.stream, '*', 'event', payload);
    } catch (error) {
      log.error('Failed to publish message from redis', {
        error,
        requestTrace: m.requestTrace,
        entity: m.entity,
        entityId: m.entityId,
        technology: Redis.TECHNOLOGY,
      });
      throw error;
    }
  }

  /**
   * Tries to read an unread message from the queue.
   */
  public async readMessage(): Promise<Message> {
    try {
      const m = await this.redis.xreadgroup(
        'GROUP',
        this.consumerGroup,
        this.consumerId,
        'COUNT',
        1,
        'STREAMS',
        this.stream,
        '>'
      );
      if (!m || m.length === 0) throw new Error('No messages in stream');
      if (m.length > 1) throw new Error('Received more messages than expected');
      // Yeah I know... Redis likes nesting arrays
      // This indexing gets the ID for the message, used for the ACK
      const msgId = m[0][1][0][0];

      // This indexing gets the `Value` for the K-V pair of the message
      const msg = m[0][1][0][1][1];
      const message = Message.parse(msg, msgId);

      return message;
    } catch (error) {
      log.error('Failed to read message from redis', {
        error,
        technology: Redis.TECHNOLOGY,
      });
      throw error;
    }
  }

  public async acknowledgeMessage(msg: Message): Promise<void> {
    try {
      await this.redis.xack(
        this.stream,
        this.consumerGroup,
        msg.redisMessageId!
      );
    } catch (error) {
      log.error('Failed to acknowledge message as read from redis', {
        error,
        entity: msg.entity,
        entityId: msg.entityId,
        requestTrace: msg.requestTrace,
        redisMessageId: msg.redisMessageId,
        technology: Redis.TECHNOLOGY,
      });
      throw error;
    }
  }
}

function checkEnvVars(): void {
  for (const envVar of [
    'REDIS_CONSUMER_GROUP_NAME',
    'REDIS_STREAM_NAME',
    'REDIS_HOST',
    'REDIS_PORT',
  ]) {
    const env = process.env[envVar];
    if (!env || env.length === 0) {
      log.error(
        `Invalid environment variable provided, please check ${envVar}`,
        {
          error: 'invalid/missing environment variable',
          technology: Redis.TECHNOLOGY,
        }
      );
      throw new Error(`Invalid ${envVar}`);
    }
  }
}

// async function main() {
//   const r = await Redis.initialize();
//   const message = new Message(Entity.CLASS, '1234', '123', 0, false);
//   // await r.publishMessage(message);
//   await r.readMessage();
// }
// main();
