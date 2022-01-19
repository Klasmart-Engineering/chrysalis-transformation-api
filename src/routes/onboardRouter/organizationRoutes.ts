import express, { Request, Response } from 'express';
import { SuccessResponse } from '../../utils';
import { C1Service } from '../../services/c1Service';
import { validateOrganizations } from '../../utils/validations';
import { OrganizationQuerySchema } from '../../interfaces/clientSchemas';

const router = express.Router();
const service = new C1Service();

router.get('/', async (req: Request, res: Response) => {
	const response = new SuccessResponse();
	const organizations: Array<OrganizationQuerySchema> = await service.getOrganizations();

	if (!organizations || organizations.length === 0) {
		return res.json(response);
	}

	const { validData, errors } = validateOrganizations(organizations);

	if (errors) {
		response.failed = errors;
	}

	if (validData) {
		// store organizations in redis

		// convert organizations to protobuff

		// call generic backend
	}

	return response;
});

export default router;
