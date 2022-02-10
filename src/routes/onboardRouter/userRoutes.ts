import express, { Request, Response } from 'express';
import {
  UserQuerySchema,
  UsersQuerySchema,
} from '../../interfaces/clientSchemas';
import { C1Service } from '../../services/c1Service';
import { validate as isValidUUID } from 'uuid';
import logger from '../../utils/logging';
import { BackendService } from '../../services/backendService';

const router = express.Router();

const service = new C1Service();
const backendService = BackendService.getInstance();
interface userBody {
  userIds: string[];
}

router.post('/', async (req: Request, res: Response) => {
  const { userIds }: userBody = req.body;
  const users: UserQuerySchema[] = [];

  if (!userIds) return res.status(400).json('No user ids provided');

  const validIds: string[] = userIds.filter((userId) => isValidUUID(userId));

  for (let index = 0; index < validIds.length; index++) {
    const id: string = validIds[index];

    try {
      const user: UsersQuerySchema = (await service.getUser(
        [id],
        {}
      )) as UsersQuerySchema;
      users.push(user.data[0]);
    } catch (error) {
      logger.error(error);
    }
  }

  if (users.length) return res.status(404).json({ message: 'No users found' });

  const result = await backendService.onboardUsers(users);

  return res.json(result);
});

router.post('/classes/:classId', async (req: Request, res: Response) => {
  const { classId } = req.params;

  if (!classId) return res.status(400).json('No class id provided');

  if (!isValidUUID(classId))
    return res.status(400).json('Invalid class id provided');

  const users: UsersQuerySchema = (await service.getUsers(
    [classId],
    {}
  )) as UsersQuerySchema;

  if (!users || users.data.length)
    return res.status(404).json({ message: 'No users found' });

  const result = await backendService.onboardUsers(users.data);

  return res.json(result);
});

router.post('/schools/:schoolId', async (req: Request, res: Response) => {
  const { schoolId } = req.params;

  if (!schoolId) return res.status(400).json('No school id provided');

  if (!isValidUUID(schoolId))
    return res.status(400).json('Invalid school id provided');

  const users: UsersQuerySchema = (await service.getUsers(
    [schoolId, 'School'],
    {}
  )) as UsersQuerySchema;

  if (!users || users.data.length)
    res.status(404).json({ message: 'No users found' });

  const result = await backendService.onboardUsers(users.data);

  return res.json(result);
});

export default router;
