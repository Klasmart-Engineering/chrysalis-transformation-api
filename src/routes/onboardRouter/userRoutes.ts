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
  
    backendService.addUsersToOrganization(usersToOrganization, '4');
  }

  const schoolUsers: UsersBySchools[] = mapUsersBySchools(users);

  for (const user of schoolUsers) {
    backendService.addUsersToSchool(user.schoolUuid, user.usersUuids, '2');
  }

  const usersToClass = addUsersToClassroom(users);
  
  backendService.addUsersToClasses(usersToClass, '3');

  const { statusCode, response, feedback } = await parseResponse();

  // let feedbackResponse;
  try {
    // feedbackResponse = await service.postFeedback(feedback);
  } catch (error) {
    throw new Error('Something went wrong on sending feedback!') ;
  }

  return res.status(statusCode).json({feedback, response});
});

export default router;
