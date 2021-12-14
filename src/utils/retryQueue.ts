import Queue from 'bee-queue';
import {redisClient} from './redis';
import {RedisClient} from 'redis';

export type Data<T> = {
  data: T
}

export class RetryQueue {
  NUMBER_OF_RETRIES = 3;
  FIRST_RETRY_DELAY = 1000;
  queue: Queue;

  constructor(queueName: string, redis?: RedisClient) {
    this.queue = new Queue(queueName, {
      redis: redis ? redis : redisClient,
      removeOnSuccess: true,
      activateDelayedJobs: true
    })
  }

  createWorker(task: CallableFunction) {
    this.queue.process( (job) => {
      return task(job.data);
    });
  }

  createJob<T>(data?: Data<T>) {
    return this.queue.createJob(data)
      .retries(this.NUMBER_OF_RETRIES)
      .backoff('exponential', this.FIRST_RETRY_DELAY)
      .save();
  }
}
