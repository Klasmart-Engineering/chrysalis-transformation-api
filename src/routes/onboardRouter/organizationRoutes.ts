import express, { Request, Response } from 'express';
import { C1Service } from '../../services/c1Service';
import { BackendService } from '../../services/backendService';
import { OrganizationQuerySchema } from '../../interfaces/clientSchemas';
import { parseResponse } from '../../utils/parseResponse';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const service = await C1Service.getInstance();
  const backendService = BackendService.getInstance();

  const organizations: OrganizationQuerySchema[] =
    await service.getOrganizations();

  backendService.resetRequest();
  backendService.mapOrganizationsToProto(organizations);

  const { statusCode, feedback } = await parseResponse();

  return res.status(statusCode).json(feedback);
});

export default router;
