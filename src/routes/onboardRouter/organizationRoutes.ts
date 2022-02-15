import express, { Request, Response } from 'express';
import { C1Service } from '../../services/c1Service';
import { BackendService } from '../../services/backendService';
import { OrganizationQuerySchema } from '../../interfaces/clientSchemas';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const service = await C1Service.getInstance();
  const backendService = BackendService.getInstance();
  const { organizationNames = [] }: { organizationNames: string[] } = req.body;

  let organizations: Array<OrganizationQuerySchema> =
    await service.getOrganizations();

  // filter out organizations that aren't in organizationNames array
  if (organizationNames.length) {
    organizations = organizations.filter((org) =>
      organizationNames.includes(org.OrganizationName)
    );
  }

  // call generic backend
  const result = await backendService.onboardOrganizations(organizations);

  // check in response for validation errors

  return res.json({ organizations, result });
});

export default router;
