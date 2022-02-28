import express, { Request, Response } from 'express';
import { ClassQuerySchema } from '../../interfaces/clientSchemas';
import { C1Service } from '../../services/c1Service';
import { BackendService } from '../../services/backendService';
import { parseResponse } from '../../utils/parseResponse';
import { ClassesBySchools } from '../../interfaces/backendSchemas';
import { mapClassesBySchools } from '../../utils';
import logger from '../../utils/logging';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const service = await C1Service.getInstance();
  const backendService = BackendService.getInstance();
  backendService.resetRequest();

  let classes: ClassQuerySchema[] = await service.getClasses();
  classes = [classes[0]];

  backendService.mapClassesToProto(classes);

  const schoolClasses: ClassesBySchools[] = mapClassesBySchools(classes);
  for (const clazz of schoolClasses) {
    backendService.addClassesToSchool(
      clazz.schoolUuid,
      clazz.classesUuids,
      '3'
    );
  }

  const { statusCode, response, feedback } = await parseResponse();

  let feedbackResponse;
  try {
    feedbackResponse = await service.postFeedback(feedback);
  } catch (error) {
    logger.error(error)
    return res.status(503).json({message: 'Something went wrong on sending feedback!'});
  }

  return res.status(statusCode).json({feedback, response, feedbackResponse});
});

export default router;
