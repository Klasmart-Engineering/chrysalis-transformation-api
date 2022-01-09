import { sleep } from '../utils';
import { AppError } from '../utils/errors';
import { Message } from '../utils/message';
import { Redis } from '../utils/redis';

const ATTEMPTS = 3;

export async function processStream(): Promise<void> {
  const redis = await Redis.initialize();
  try {
    const msg = await redis.readMessage();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        await msg.process();
        break;
      } catch (error) {
        if (msg.processingAttempts === ATTEMPTS) throw error;
      }
    }
    await redis.acknowledgeMessage(msg);
  } catch (error) {
    if (error instanceof Error && error.message === 'No messages in stream') {
      await sleep(500);
      return;
    }
  }
}
