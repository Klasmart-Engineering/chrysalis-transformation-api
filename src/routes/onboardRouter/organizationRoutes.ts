import express, { Request, Response } from 'express';
// import grpc from "@grpc/grpc-js";
// import protoLoader from "@grpc/proto-loader";
import { SuccessResponse } from '../../utils';
import { C1Service } from '../../services/c1Service';
import { OrganizationQuerySchema } from '../../interfaces/clientSchemas';
import { Cache } from '../../utils/cache';
import { Organization } from '../../protos';
// import PROTO_PATH from '../../../protos/api.proto';
import logger from '../../utils/logging';

const router = express.Router();
const service = new C1Service();
const cache = Cache.getInstance();

router.post('/', async (req: Request, res: Response) => {
	const { organizationNames = [] }: { organizationNames: string[] } = req.body;

	const response = new SuccessResponse();
	let organizations: Array<OrganizationQuerySchema> = await service.getOrganizations();

	if (!organizations || organizations.length === 0) {
		return res.json(response);
	}

	// cache organizations
	organizations.forEach((org: OrganizationQuerySchema) => {
		cache.addOrganizationId(org.OrganizationName, org.OrganizationUUID)
	});

	// filter out organizations that aren't in organizationNames array
	if (organizationNames.length) {
		organizations = organizations.filter(org => organizationNames.includes(org.OrganizationName));
	}

	// map organizations to protobuf schema
	const protoOrganizations = organizations.map(org => {
		const protoOrg = new Organization();

		protoOrg
			.setName(org.OrganizationName)
			.setExternalUuid(org.OrganizationUUID);

		return protoOrg.toString();
	});

	logger.info(protoOrganizations);
	

	// call generic backend
	// const options = {
	// 	keepCase: true,
	// 	longs: String,
	// 	enums: String,
	// 	defaults: true,
	// 	oneofs: true,
	// };

	// const packageDefinition = protoLoader.loadSync(PROTO_PATH, options);
	// const ApiService = grpc.loadPackageDefinition(packageDefinition).Onboarding;

	// const client = new ApiService(
	// 	"localhost:3200",
	// 	grpc.credentials.createInsecure()
	// );

	// check in response for validation errors

	return response;
});

export default router;
