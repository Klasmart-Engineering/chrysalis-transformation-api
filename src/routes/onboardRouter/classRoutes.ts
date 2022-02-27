import express, { Request, Response } from 'express';
import { ClassQuerySchema } from '../../interfaces/clientSchemas';
import { C1Service } from '../../services/c1Service';
import { BackendService } from '../../services/backendService';
import { parseResponse } from '../../utils/parseResponse';
import { ClassesBySchools } from '../../interfaces/backendSchemas';
import { mapClassesBySchools } from '../../utils';
import { BackendResponses } from '../../interfaces/backendResponse';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const service = await C1Service.getInstance();
  const backendService = BackendService.getInstance();
  const allResponses: BackendResponses = {responsesList: []};
  const allFeedback = [];
  const allFeedbackResponses = [];
  const allStatuses = [];

  let classes: ClassQuerySchema[] = await service.getClasses();

  while (classes.length > 0) {
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

    const { statusCode, response, feedback } = await parseResponse();
    allResponses.responsesList.push(...response.responsesList)
    allFeedback.push(...feedback)
    allStatuses.push(statusCode);
    let feedbackResponse;
    try {
      feedbackResponse = await service.postFeedback(feedback);
      allFeedbackResponses.push(...feedbackResponse);
    } catch (error) {
      throw new Error('Something went wrong on sending feedback!');
    }
    classes = await service.getClasses();
  }

  const statusCode = allStatuses.includes(200) ? 200 : 400;

  return res.status(statusCode).json({
    feedback: allFeedback,
    response: allResponses,
    feedbackResponse: allFeedbackResponses
  });
});

export default router;
