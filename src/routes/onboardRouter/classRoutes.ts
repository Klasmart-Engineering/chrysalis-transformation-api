import express, { Request, Response } from 'express';
import { ClassQuerySchema } from '../../interfaces/clientSchemas';
import { C1Service } from '../../services/c1Service';
import { BackendService } from '../../services/backendService';
import { parseResponse } from '../../utils/parseResponse';
import { ClassesBySchools } from '../../interfaces/backendSchemas';
import { HttpError, mapClassesBySchools } from '../../utils';
import logger from '../../utils/logging';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const service = await C1Service.getInstance();
  const backendService = BackendService.getInstance();

  backendService.resetRequest();

  const classes: ClassQuerySchema[] = await service.getClasses();

  backendService.mapClassesToProto(classes);

  const schoolClasses: ClassesBySchools[] = mapClassesBySchools(classes);
  for (const clazz of schoolClasses) {
    backendService.addClassesToSchool(
      clazz.schoolUuid,
      clazz.classesUuids,
      '3'
    );
  }

  const { statusCode, feedback } = await parseResponse();

  let feedbackResponse;
  try {
    feedbackResponse = await service.postFeedback(feedback);
  } catch (error) {
    logger.error(error)
    return res.status(error instanceof HttpError ? error.status : 500)
              .json({message: 'Something went wrong on sending feedback!'});
  }

  return res.status(statusCode).json(feedbackResponse);
});

export default router;
