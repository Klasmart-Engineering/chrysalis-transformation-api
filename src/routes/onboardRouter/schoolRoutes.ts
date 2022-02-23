import express, { Request, Response } from 'express';
import { C1Service } from '../../services/c1Service';
import { BackendService } from '../../services/backendService';
import { SchoolQuerySchema } from '../../interfaces/clientSchemas';
import { parseResponse } from '../../utils/parseResponse';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const service = await C1Service.getInstance();
  const backendService = BackendService.getInstance();
  backendService.resetRequest();

  const schools: SchoolQuerySchema[] = await service.getSchools();

  backendService.mapSchoolsToProto(schools);

  const { statusCode, response, feedback } = await parseResponse();

  let feedbackResponse;
  try {
    feedbackResponse = await service.postFeedback(feedback);
  } catch (error) {
    throw new Error('Something went wrong on sending feedback!') ;
  }

  return res.status(statusCode).json({feedback, response, feedbackResponse});
});
export default router;
