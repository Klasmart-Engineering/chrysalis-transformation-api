import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client'

const router = express.Router();
const prisma = new PrismaClient()

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  await prisma.test.findMany();
  res.send('Hello world from api');
});

export default router;
