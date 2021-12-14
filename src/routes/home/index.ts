import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client'
import {HttpError} from '../../utils';
import {McbService} from '../../services/mcbService'
import {RetryQueue} from '../../utils';

const router = express.Router();
const prisma = new PrismaClient();
const service = new McbService();

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

//this function should be de deleted in the future
router.get('/schools/:KLProgrammeGUID', async (req: Request, res: Response) => {
  try {
    const schools = await service.getSchools(req.params);
    res.json(schools);
  } catch (e) {
    e instanceof HttpError ? res.status(e.status).json(e) : res.status(500).json(e);
  }
});

export default router;
