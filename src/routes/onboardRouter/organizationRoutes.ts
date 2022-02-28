import express, { Request, Response } from 'express';
import { C1Service } from '../../services/c1Service';
import { BackendService } from '../../services/backendService';
import { OrganizationQuerySchema } from '../../interfaces/clientSchemas';
import { parseResponse } from '../../utils/parseResponse';
import logger from '../../utils/logging';
import { HttpError } from '../../utils';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const service = await C1Service.getInstance();
  const backendService = BackendService.getInstance();
  backendService.resetRequest();

  const organizations: OrganizationQuerySchema[] =
    await service.getOrganizations();

  backendService.mapOrganizationsToProto(organizations);

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
