import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client'

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  const school = await prisma.school.findMany();
  res.json(school);
});

export default router;
