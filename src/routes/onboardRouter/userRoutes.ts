import express, { Request, Response } from 'express';
import {
  UserQuerySchema,
} from '../../interfaces/clientSchemas';
import { C1Service } from '../../services/c1Service';
import { BackendService } from '../../services/backendService';
import {
  addUsersToClassroom,
  addUsersToOrganization,
  mapUsersByOrgs,
  parseResponse
} from '../../utils';
import { UsersByOrgs } from '../../interfaces/backendSchemas';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const service = await C1Service.getInstance();
  const backendService = BackendService.getInstance();
  backendService.resetRequest();

  const users: UserQuerySchema[] = await service.getUsers();
  //TODO delete school uuid when be provided by C1 in user object
  // backendService.mapUsersToProto(users, 'to-be-changed-with-school-uuid');

  // map users by organization and use addUsersToOrganization function
  const orgUsers: UsersByOrgs[] = mapUsersByOrgs(users); 

  for (const user of orgUsers) {
    const usersToOrganization = addUsersToOrganization(
      user.organization,
      user.users
    );
  
    backendService.addUsersToOrganization(usersToOrganization);
  }

  // map users by school classes and use addUsersToClass function
  const usersToClass = addUsersToClassroom(users);
  backendService.addUsersToClasses(usersToClass);

  const { statusCode, response } = await parseResponse();

  return res.status(statusCode).json(response);
});

export default router;
