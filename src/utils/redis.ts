import redis from 'redis';

export const REDIS_PORT = Number(String(process.env.REDIS_PORT)) || 6379;
export const REDIS_HOST = process.env.REDIS_HOST || 'localhost';

export const redisClient = redis.createClient(REDIS_PORT, REDIS_HOST);
