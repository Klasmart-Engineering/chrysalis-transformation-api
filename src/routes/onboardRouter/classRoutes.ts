import express, { Request, Response } from 'express';
import { parseResponse } from '../../utils';
import {
  ClassQuerySchema,
} from '../../interfaces/clientSchemas';
import { C1Service } from '../../services/c1Service';
import { BackendService } from '../../services/backendService';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const service = await C1Service.getInstance();
  const backendService = BackendService.getInstance();
  backendService.resetRequest();

  const classes: ClassQuerySchema[] = await service.getAllClasses();

  backendService.mapClassesToProto(classes);

  const { statusCode, response } = await parseResponse();

  return res.status(statusCode).json(response);
});

export default router;
