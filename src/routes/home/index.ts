import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client'
import createError from 'http-errors';
import Queue from 'bee-queue';
import {redisClient} from '../../utils';

const router = express.Router();
const prisma = new PrismaClient();

const testQueue = new Queue('testQueue', {
  redis: redisClient,
  removeOnSuccess: true,
});

//get all
router.get('/', async (req: Request, res: Response) => {
  const testPrisma = await prisma.test.findMany();
  res.json(testPrisma);
});


//insert with required email, add job to queue
router.post('/add', async (req: Request, res: Response) => {
  if (req.body.email) {
    const job = await testQueue.createJob(req.body).retries(2).save();
    job.on('succeeded', result => res.status(200).json(result));
    job.on('failed', error => res.status(400).send(createError(400, error.message)));
  } else res.status(400).send(createError(400, 'Email not provided'));
});

//worker for job queue
testQueue.process(async (job) => {
  return new Promise((resolve, reject) => {
    prisma.test.create({data: job.data}).then((value) => {
      resolve(value);
    }).catch(error => {
      if (error) {
        if (error.code === 'P2002') {
          reject({ message: 'There is a unique constraint violation' });
        }
      }
      reject({ message: 'something went wrong' });
    })
  });
});

//get by id
router.get('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (id) {
    await prisma.test.findUnique({where: {id: id}})
      .then(data => data !== null ? res.json(data) : res.status(404).send(createError(404)))
      .catch(error => res.send(createError(error)));
  }
});

export default router;
