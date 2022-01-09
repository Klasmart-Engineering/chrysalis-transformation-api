import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { body, Meta } from 'express-validator';
import { Redis } from '../utils/redis';
import { Message } from '../utils/message';
import { Entity } from '../entities';

const router = Router();

const arrayValidator =
  (minLengthForEachElement = 3) =>
  (input: unknown, _: Meta) => {
    if (!Array.isArray(input)) return false;
    for (const e of input) {
      if (typeof e !== 'string') return false;
      if (e.length < minLengthForEachElement) return false;
    }
    return true;
  };

const defaultBodyValidator = body('ids').custom(arrayValidator);

router.post('/organization/all', async (req: Request, res: Response) => {
  const trace = (req.headers.trace as string) || uuidv4();
  const redis = await Redis.initialize();
  const msg = new Message(Entity.ORGANIZATION, 'ALL', trace, 0, true, true);
  await redis.publishMessage(msg);
  res.status(200).json({ requestId: trace });
});

router.post(
  '/organization',
  defaultBodyValidator,
  async (req: Request, res: Response) => {
    const response = await processRequest(Entity.ORGANIZATION, req, res);
    response.send();
  }
);

router.post(
  '/school',
  defaultBodyValidator,
  async (req: Request, res: Response) => {
    const response = await processRequest(Entity.SCHOOL, req, res);
    response.send();
  }
);

router.post(
  '/class',
  defaultBodyValidator,
  async (req: Request, res: Response) => {
    const response = await processRequest(Entity.CLASS, req, res);
    response.send();
  }
);

router.post(
  '/user',
  defaultBodyValidator,
  async (req: Request, res: Response) => {
    const response = await processRequest(Entity.USER, req, res);
    response.send();
  }
);

async function processRequest(entity: Entity, req: Request, res: Response) {
  const trace = (req.headers.trace as string) || uuidv4();
  const cascade = shouldCascade(req);

  const redis = await Redis.initialize();
  const ids: string[] = req.body['ids'];

  const messages = ids.map((id) => {
    const msg = new Message(entity, id, trace, 0, cascade, false);
    return redis.publishMessage(msg);
  });

  await Promise.all(messages);
  return res.status(200).json({ requestId: trace });
}

function shouldCascade(req: Request): boolean {
  if (req.params.cascade == 'true') return true;
  return false;
}

export const v1Router = router;
