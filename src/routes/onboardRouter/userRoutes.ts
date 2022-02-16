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
  mapUsersBySchools,
} from '../../utils';
import { UsersByOrgs, UsersBySchools } from '../../interfaces/backendSchemas';
import { parseResponse } from '../../utils/parseResponse';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const service = await C1Service.getInstance();
  const backendService = BackendService.getInstance();
  backendService.resetRequest();

  const users: UserQuerySchema[] = await service.getUsers();
  
  backendService.mapUsersToProto(users);

  const orgUsers: UsersByOrgs[] = mapUsersByOrgs(users); 

  for (const user of orgUsers) {
    const usersToOrganization = addUsersToOrganization(
      user.organization,
      user.users
    );
  
    backendService.addUsersToOrganization(usersToOrganization);
  }

  const schoolUsers: UsersBySchools[] = mapUsersBySchools(users);

  for (const user of schoolUsers) {
    backendService.addUsersToSchool(user.schoolUuid, user.usersUuids);
  }

  const usersToClass = addUsersToClassroom(users);
  
  backendService.addUsersToClasses(usersToClass);

  const { statusCode, response } = await parseResponse();

  return res.status(statusCode).json(response);
});

export default router;
