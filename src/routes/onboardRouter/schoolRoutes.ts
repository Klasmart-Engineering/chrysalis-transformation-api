import express, { Request, Response } from 'express';
import { C1Service } from '../../services/c1Service';
import { BackendService } from '../../services/backendService';
import { SchoolQuerySchema } from '../../interfaces/clientSchemas';
import {
  alreadyProcess,
  Entity,
  parseResponse,
} from '../../utils/parseResponse';
import { log } from '../../utils/logging';
import { HttpError } from '../../utils';
import { arraysMatch } from '../../utils/arraysMatch';
import { dedupeSchools } from '../../utils/dedupe';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const service = await C1Service.getInstance();
  const backendService = BackendService.getInstance();
  const allFeedbackResponses = [];
  const allStatuses = [];

  let schools: SchoolQuerySchema[] = await service.getSchools();
  let uniqueSchools = dedupeSchools(schools);
  let prevSchoolsIds: string[] = [];
  let feedbackResponse;

  if (!schools.length) {
    const response = alreadyProcess(null, Entity.SCHOOL);
    return res.status(200).json(response);
  }

  while (schools.length > 0) {
    const curSchoolsIds = schools.map((school) => school.SchoolUUID);
    if (arraysMatch(prevSchoolsIds, curSchoolsIds)) {
      const response = alreadyProcess(schools, Entity.SCHOOL, feedbackResponse);
      return res.status(200).json(response);
    }
    backendService.resetRequest();
    backendService.mapSchoolsToProto(uniqueSchools);

    const { statusCode, feedback } = await parseResponse();
    allStatuses.push(statusCode);

    try {
      feedbackResponse = await service.postFeedback(feedback);
      allFeedbackResponses.push(...feedbackResponse);
    } catch (error) {
      log.error(
        { error, targetApi: 'C1' },
        'Failed to post feedback for schools'
      );
      return res.status(error instanceof HttpError ? error.status : 500).json({
        message:
          'Something went wrong on sending feedback for onboarding schools!',
        feedback,
      });
    }
    prevSchoolsIds = curSchoolsIds;
    schools = await service.getSchools();
    uniqueSchools = dedupeSchools(schools);
  }

  const statusCode = allStatuses.includes(200) ? 200 : 400;
  return res.status(statusCode).json(allFeedbackResponses);
});
export default router;
