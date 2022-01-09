import { processStream } from './consumer';
import { Context, log } from './utils';
import { Redis } from './utils/redis';

async function main() {
  log.info('Initializing worker');
  await Redis.initialize();
  await Context.getInstance();
  log.info('Worker initialized');

  log.info('Consuming stream');
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      log.silly('Listening for message on stream');
      await processStream();
    } catch (error) {
      log.error('Unexpected error occurred', { error });
    }
  }
}
main().catch((e) => log.error(`App unexpectedly crashed`, { error: e }));
