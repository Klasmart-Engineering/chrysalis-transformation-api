import express, { Request, Response } from 'express';
import {
  UserQuerySchema,
} from '../../interfaces/clientSchemas';
import { C1Service } from '../../services/c1Service';
import { BackendService } from '../../services/backendService';
import {
  addUsersToClassroom,
  addUsersToOrganization,
  HttpError,
  mapUsersByOrgs,
  mapUsersBySchools,
} from '../../utils';
import { UsersByOrgs, UsersBySchools } from '../../interfaces/backendSchemas';
import { parseResponse } from '../../utils/parseResponse';
import logger from '../../utils/logging';
import {arraysMatch} from "../../utils/arraysMatch";
import { dedupeUsers } from "../../utils/dedupe";

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const service = await C1Service.getInstance();
  const backendService = BackendService.getInstance();
  const allFeedbackResponses = [];
  const allStatuses = [];

  let users: UserQuerySchema[] = await service.getUsers();
  let uniqueUsers = dedupeUsers(users);
  let prevUsersIds: string[] = [];

  if (!users.length) {
    return res.status(204).json({message: 'No more users to onboard!'})
  }

  while (users.length > 0) {
    const curUsersIds = users.map(user => user.UserUUID);
    if (arraysMatch(prevUsersIds, curUsersIds)) {
      return res.status(200).json({message: 'Users already onboarded!'})
    }
    backendService.resetRequest();
    backendService.mapUsersToProto(uniqueUsers);

    const orgUsers: UsersByOrgs[] = mapUsersByOrgs(uniqueUsers);

    for (const user of orgUsers) {
      const usersToOrganization = addUsersToOrganization(
          user.organization,
          user.users
      );

      backendService.addUsersToOrganization(usersToOrganization, '4');
    }

    const schoolUsers: UsersBySchools[] = mapUsersBySchools(uniqueUsers);

    for (const user of schoolUsers) {
      backendService.addUsersToSchool(user.schoolUuid, user.usersUuids, '2');
    }

    const usersToClass = addUsersToClassroom(uniqueUsers);

    backendService.addUsersToClasses(usersToClass, '3');

    const {statusCode, feedback} = await parseResponse();
    allStatuses.push(statusCode);
    let feedbackResponse;
    try {
      feedbackResponse = await service.postFeedback(feedback);
      allFeedbackResponses.push(...feedbackResponse);
    } catch (error) {
      logger.error(error)
      return res.status(error instanceof HttpError ? error.status : 500)
          .json({message: 'Something went wrong on sending feedback for onboarding users!'});
    }
    prevUsersIds = curUsersIds;
    users = await service.getUsers();
    uniqueUsers = dedupeUsers(users);
  }

  const statusCode = allStatuses.includes(200) ? 200 : 400;
  return res.status(statusCode).json(allFeedbackResponses);
});

export default router;
