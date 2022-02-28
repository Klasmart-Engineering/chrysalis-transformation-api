import express, { Request, Response } from 'express';
import { C1Service } from '../../services/c1Service';
import { BackendService } from '../../services/backendService';
import { SchoolQuerySchema } from '../../interfaces/clientSchemas';
import { parseResponse } from '../../utils/parseResponse';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const service = await C1Service.getInstance();
  const backendService = BackendService.getInstance();
  const allFeedbackResponses = [];
  const allStatuses = [];

  let schools: SchoolQuerySchema[] = await service.getSchools();

  while (schools.length > 0) {
    backendService.resetRequest();
    backendService.mapSchoolsToProto(schools);

    const { statusCode, feedback } = await parseResponse();
    allStatuses.push(statusCode);
    let feedbackResponse;
    try {
      feedbackResponse = await service.postFeedback(feedback);
      allFeedbackResponses.push(...feedbackResponse);
    } catch (error) {
      throw new Error('Something went wrong on sending feedback!');
    }
    schools = await service.getSchools();
  }

  const statusCode = allStatuses.includes(200) ? 200 : 400;

  return res.status(statusCode).json({
    feedbackResponse: allFeedbackResponses
  });
});
export default router;
