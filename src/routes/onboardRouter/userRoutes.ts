import express, { Request, Response } from 'express';
import { UserQuerySchema } from '../../interfaces/clientSchemas';
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
import {
  alreadyProcess,
  Entity,
  parseResponse,
} from '../../utils/parseResponse';
import { log } from '../../utils/logging';
import { arraysMatch } from '../../utils/arraysMatch';
import { dedupeUsers } from '../../utils/dedupe';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const service = await C1Service.getInstance();
  const backendService = BackendService.getInstance();
  const allFeedbackResponses = [];
  const allStatuses = [];

  let users: UserQuerySchema[] = await service.getUsers();
  let uniqueUsers = dedupeUsers(users);
  let prevUsersIds: string[] = [];
  let feedbackResponse;

  if (!users.length) {
    const response = alreadyProcess(null, Entity.USER);
    return res.status(200).json(response);
  }

  while (users.length > 0) {
    const curUsersIds = users.map((user) => user.UserUUID);
    if (arraysMatch(prevUsersIds, curUsersIds)) {
      const response = alreadyProcess(users, Entity.USER, feedbackResponse);
      return res.status(200).json(response);
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

      const schoolUsers: UsersBySchools[] = mapUsersBySchools(user.users);
      for (const usr of schoolUsers) {
        backendService.addUsersToSchool(usr.schoolUuid, usr.usersUuids, '2');
      }

      const usersToClass = addUsersToClassroom(user.users);
      backendService.addUsersToClasses(usersToClass, '3');
    }

    const { statusCode, feedback } = await parseResponse();
    allStatuses.push(statusCode);

    try {
      feedbackResponse = await service.postFeedback(feedback);
      allFeedbackResponses.push(...feedbackResponse);
    } catch (error) {
      log.error(
        { error, targetApi: 'C1' },
        'Failed to post feedback for users'
      );
      return res.status(error instanceof HttpError ? error.status : 500).json({
        message:
          'Something went wrong on sending feedback for onboarding users!',
        feedback,
      });
    }
    prevUsersIds = curUsersIds;
    users = await service.getUsers();
    uniqueUsers = dedupeUsers(users);
  }

  const statusCode = allStatuses.includes(200) ? 200 : 400;
  return res.status(statusCode).json(allFeedbackResponses);
});

export default router;
