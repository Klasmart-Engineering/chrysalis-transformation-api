import { sleep } from '../utils';
import { logError } from '../utils/errors';
import { Redis } from '../utils/redis';

export const MESSAGE_PROCESSING_ATTEMPTS = 3;

export async function processStream(): Promise<void> {
  const redis = await Redis.initialize();
  try {
    const msg = await redis.readMessage();
    if (msg.processingAttempts >= MESSAGE_PROCESSING_ATTEMPTS) {
      await redis.acknowledgeMessage(msg);
    }
    let didFail = false;
    try {
      await msg.process();
    } catch (error) {
      logError(error);
      didFail = true;
    }
    // Regardless of whether it succeeds or fails we acknowledge the message
    await redis.acknowledgeMessage(msg);
    if (didFail) {
      await redis.publishMessage(msg);
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'No messages in stream') {
      await sleep(1000);
      return;
    }
    logError(error);
  }
}
