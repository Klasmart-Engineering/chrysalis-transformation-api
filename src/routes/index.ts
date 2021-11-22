import express from 'express';
import HomeRouter from './home'

const router = express.Router();

router.use('/', HomeRouter);

export default router;
