import express, { Request, Response } from 'express';
import { C1Service } from '../../services/c1Service';
import { BackendService } from '../../services/backendService';
import { OrganizationQuerySchema } from '../../interfaces/clientSchemas';
import { parseResponse } from '../../utils';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const service = await C1Service.getInstance();
  const backendService = BackendService.getInstance();
  backendService.resetRequest();

  const organizations: OrganizationQuerySchema[] =
    await service.getOrganizations();

  backendService.mapOrganizationsToProto(organizations);

  const { statusCode, response } = await parseResponse();

  return res.status(statusCode).json(response);
});

export default router;
