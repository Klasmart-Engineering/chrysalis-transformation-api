import express, { Request, Response } from 'express';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'chrysalis-transformation-api is running!' });
});

export default router;
