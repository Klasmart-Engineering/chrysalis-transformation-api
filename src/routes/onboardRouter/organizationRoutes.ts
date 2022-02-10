import express, { Request, Response } from 'express';
import { SuccessResponse } from '../../utils';
import { C1Service } from '../../services/c1Service';
import { BackendService } from '../../services/backendService';
import { OrganizationQuerySchema } from '../../interfaces/clientSchemas';
import { Cache } from '../../utils/cache';

const router = express.Router();
const service = new C1Service();
const cache = Cache.getInstance();
const backendService = BackendService.getInstance();

router.post('/', async (req: Request, res: Response) => {
  const { organizationNames = [] }: { organizationNames: string[] } = req.body;

  const response = new SuccessResponse();
  let organizations: Array<OrganizationQuerySchema> =
    await service.getOrganizations();

  if (!organizations || organizations.length === 0) {
    return res.json(response);
  }

  // cache organizations
  organizations.forEach((org: OrganizationQuerySchema) => {
    cache.addOrganizationId(org.OrganizationName, org.OrganizationUUID);
  });

  // filter out organizations that aren't in organizationNames array
  if (organizationNames.length) {
    organizations = organizations.filter((org) =>
      organizationNames.includes(org.OrganizationName)
    );
  }

	// call generic backend
	const result = await backendService.onboardOrganizations(organizations)

  // check in response for validation errors

	return res.json({ organizations, result });
});

export default router;
