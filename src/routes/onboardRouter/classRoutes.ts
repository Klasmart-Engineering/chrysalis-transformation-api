import express, { Request, Response } from 'express';
import { ClassQuerySchema } from '../../interfaces/clientSchemas';
import { C1Service } from '../../services/c1Service';
import { BackendService } from '../../services/backendService';
import { alreadyProcess, Entity, parseResponse } from '../../utils/parseResponse';
import { ClassesBySchools } from '../../interfaces/backendSchemas';
import { HttpError, mapClassesBySchools } from '../../utils';
import logger from '../../utils/logging';
import { arraysMatch } from '../../utils/arraysMatch';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const service = await C1Service.getInstance();
  const backendService = BackendService.getInstance();
  const allFeedbackResponses = [];
  const allStatuses = [];

  let classes: ClassQuerySchema[] = await service.getClasses();
  let prevClassesIds: string[] = [];

  if (!classes.length) {
    const response = alreadyProcess(null, Entity.CLASS);
    return res.status(204).json(response);
  }

  while (classes.length > 0) {
    const curClassesIds = classes.map((clazz) => clazz.ClassUUID);
    let feedbackResponse;

    if (arraysMatch(prevClassesIds, curClassesIds)) {
      const response = alreadyProcess(classes, Entity.CLASS, feedbackResponse);
      return res.status(200).json(response);
    }
    backendService.resetRequest();
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
    allStatuses.push(statusCode);

    try {
      feedbackResponse = await service.postFeedback(feedback);
      allFeedbackResponses.push(...feedbackResponse);
    } catch (error) {
      logger.error(error);
      return res.status(error instanceof HttpError ? error.status : 500).json({
        message:
          'Something went wrong on sending feedback for onboarding classes!',
      });
    }
    prevClassesIds = curClassesIds;
    classes = await service.getClasses();
  }

  const statusCode = allStatuses.includes(200) ? 200 : 400;
  return res.status(statusCode).json(allFeedbackResponses);
});

export default router;
