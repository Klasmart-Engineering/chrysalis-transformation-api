import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client'
import {RetryQueue} from '../../utils';

const router = express.Router();
const prisma = new PrismaClient();

const retryQueue = new RetryQueue('test');
retryQueue.createWorker(getSchools);

router.get('/', async (req: Request, res: Response) => {
  const job = await retryQueue.createJob();
  job.on('succeeded', result => res.status(200).json(result));
  job.on('failed', error => res.status(400).json(error.message));
});

//example worker function, this should be deleted in the future
function getSchools() {
  return new Promise((resolve, reject) => {
    prisma.school.findMany().then((value) => {
      resolve(value);
    }).catch(error => {
      reject(error);
    })
  });
}

export default router;
