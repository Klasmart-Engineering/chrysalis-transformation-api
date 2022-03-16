import express, { Request, Response } from 'express';
import { C1Service } from '../../services/c1Service';
import { BackendService } from '../../services/backendService';
import { SchoolQuerySchema } from '../../interfaces/clientSchemas';
import { parseResponse } from '../../utils/parseResponse';
import logger from '../../utils/logging';
import { HttpError } from '../../utils';
import { arraysMatch } from '../../utils/arraysMatch';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const service = await C1Service.getInstance();
  const backendService = BackendService.getInstance();
  const allFeedbackResponses = [];
  const allStatuses = [];

  let schools: SchoolQuerySchema[] = await service.getSchools();
  let prevSchoolsIds: string[] = [];

  if (!schools.length) {
    return res.status(204).json({ message: 'No more schools to onboard!' });
  }

  while (schools.length > 0) {
    const curSchoolsIds = schools.map((school) => school.SchoolUUID);
    if (arraysMatch(prevSchoolsIds, curSchoolsIds)) {
      return res.status(200).json({ message: 'Schools already onboarded!' });
    }
    backendService.resetRequest();
    backendService.mapSchoolsToProto(schools);

    const { statusCode, feedback } = await parseResponse();
    allStatuses.push(statusCode);
    let feedbackResponse;
    try {
      feedbackResponse = await service.postFeedback(feedback);
      allFeedbackResponses.push(...feedbackResponse);
    } catch (error) {
      logger.error(error);
      return res.status(error instanceof HttpError ? error.status : 500).json({
        message:
          'Something went wrong on sending feedback for onboarding schools!',
      });
    }
    prevSchoolsIds = curSchoolsIds;
    schools = await service.getSchools();
  }

  const statusCode = allStatuses.includes(200) ? 200 : 400;
  return res.status(statusCode).json(allFeedbackResponses);
});
export default router;
