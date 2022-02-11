import express, { Request, Response } from 'express';
import {
  UserQuerySchema,
} from '../../interfaces/clientSchemas';
import { C1Service } from '../../services/c1Service';
import { BackendService } from '../../services/backendService';
import { parseResponse } from '../../utils';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const service = await C1Service.getInstance();
  const backendService = BackendService.getInstance();
  backendService.resetRequest();

  const users: UserQuerySchema[] = await service.getAllUsers();

  //TODO delete school uuid when be provided by C1 in user object
  backendService.mapUsersToProto(users, 'to-be-changed');

  //TODO map users by organization and use addUsersToOrganization function
  //TODO map users by school classes and use addUsersToClass function
  const { statusCode, response } = await parseResponse();

  return res.status(statusCode).json(response);
});

export default router;
