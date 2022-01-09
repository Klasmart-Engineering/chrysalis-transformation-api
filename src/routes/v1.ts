import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { body, Meta, validationResult } from 'express-validator';
import createError from 'http-errors';
import { Redis } from '../utils/redis';
import { Message, ProcessingStage } from '../utils/message';
import { Entity } from '../entities';
import { API_KEY } from '../app';
import { validate as validateUuid } from 'uuid';

const router = Router();

const arrayValidator = (input: unknown, _: Meta) => {
  if (!Array.isArray(input))
    return Promise.reject('Expected an array of UUIDs');
  for (let i = 0; i < input.length; i++) {
    const id = input[i];
    if (typeof id !== 'string')
      return Promise.reject(
        `Expected each UUID to be in string format.\nElement at index ${i} was of type: ${typeof id}`
      );
    if (!validateUuid(id))
      return Promise.reject(`Element ${id} at index ${i} is not a valid UUID`);
  }
  return true;
};

const defaultBodyValidator = body('ids').custom(arrayValidator);

router.use((req: Request, _: Response, next: NextFunction) => {
  if (req.header('X-Api-Key') !== API_KEY)
    throw createError(401, 'Unauthorized Request');
  next();
});

router.post('/process-all', async (req: Request, res: Response) => {
  const trace = (req.headers.trace as string) || uuidv4();
  const redis = await Redis.initialize();
  const msg = new Message(
    Entity.ORGANIZATION,
    'ALL',
    trace,
    0,
    true,
    ProcessingStage.FETCH_DATA,
    true
  );
  await redis.publishMessage(msg);
  res.status(200).json({ requestId: trace });
});

router.post(
  '/organization',
  defaultBodyValidator,
  async (req: Request, res: Response) => {
    await processRequest(Entity.ORGANIZATION, req, res);
  }
);

router.post(
  '/school',
  defaultBodyValidator,
  async (req: Request, res: Response) => {
    await processRequest(Entity.SCHOOL, req, res);
  }
);

router.post(
  '/class',
  defaultBodyValidator,
  async (req: Request, res: Response) => {
    await processRequest(Entity.CLASS, req, res);
  }
);

router.post(
  '/user',
  defaultBodyValidator,
  async (req: Request, res: Response) => {
    await processRequest(Entity.USER, req, res);
  }
);

async function processRequest(entity: Entity, req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  const trace = (req.headers.trace as string) || uuidv4();
  const cascade = shouldCascade(req);

  const redis = await Redis.initialize();
  const ids: string[] = req.body['ids'];

  const messages = ids.map((id) => {
    const msg = new Message(
      entity,
      id,
      trace,
      0,
      cascade,
      ProcessingStage.FETCH_DATA,
      false
    );
    return redis.publishMessage(msg);
  });

  await Promise.all(messages);
  return res.status(200).json({ requestId: trace });
}

function shouldCascade(req: Request): boolean {
  const cascade = req.query.cascade;
  if (cascade === undefined) return false;
  if (typeof cascade === 'string' && cascade === 'true') return true;
  if (typeof cascade === 'boolean' && cascade) return true;
  return false;
}

export const v1Router = router;
