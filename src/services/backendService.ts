
import * as grpc from "@grpc/grpc-js";
import { proto } from 'cil-lib/src'
import { Responses, School } from 'cil-lib/dist/main/lib/protos';
import { OrganizationQuerySchema, SchoolQuerySchema } from '../interfaces/clientSchemas';
import logger from '../utils/logging';
import { ServiceError } from '@grpc/grpc-js';
import { Cache } from '../utils/cache';

const { BatchOnboarding, OnboardingRequest, Organization } = proto;
const cache = Cache.getInstance();

export class BackendService {
	private _client: proto.OnboardingClient;
	private static _instance: BackendService;

	private constructor(client: proto.OnboardingClient) {
		this._client = client;
	}

	get client(): proto.OnboardingClient {
		return this._client;
	}

	public static getInstance() {
		try {
			if (this._instance) {
				return this._instance;
			} else {
				// const channel = new InsecureChannelCredentialsImpl(grpc.CallCredentials.createEmpty())
				// const channel = grpc.credentials.createInsecure()
				const channel: grpc.ChannelCredentials = grpc.ChannelCredentials.createInsecure() as grpc.ChannelCredentials
				const client = new proto.OnboardingClient('127.0.0.1:3200', channel)
				this._instance = new BackendService(client);
				logger.info('Connected to Generic backend');
				return this._instance;
			}
		} catch (e) {
			logger.error('❌ Failed to connect to Generic backend');
			throw e;
		}
	}

	async onboardOrganizations(organizations: OrganizationQuerySchema[] = []) {
		return new Promise((resolve, reject) => {
			const request = new BatchOnboarding();

			organizations.forEach(org => {
				const onboardOrgRequest = new OnboardingRequest()
				const organization = new Organization()

				organization.setName(org.OrganizationName)
					.setExternalUuid(org.OrganizationUUID)

				onboardOrgRequest.setOrganization(organization)
				request.addRequests(onboardOrgRequest)
			})

			this._client.onboard(request, (err: ServiceError | null, responses: Responses) => {
				if (err !== null) {
					reject(err); return;
				}

				logger.info(responses)

				resolve(responses);
			});
		});
	};

	async onboardSchools(schools: SchoolQuerySchema[] = []) {
		return new Promise((resolve, reject) => {
			const request = new BatchOnboarding();

			schools.forEach(async school => {
				const onboardSchoolRequest = new OnboardingRequest()
				const schoolProto = new School()
				const organizationUuid = await cache.getOrganizationId(school.OrganizationName)
				schoolProto.setExternalUuid(school.SchoolUUID)
					.setName(school.SchoolName)
					.setShortCode(school.SchoolShortCode)
					.setExternalOrganizationUuid(organizationUuid);

				onboardSchoolRequest.setSchool(schoolProto);
				request.addRequests(onboardSchoolRequest);
			})

			this._client.onboard(request, (err: ServiceError | null, responses: Responses) => {
				if (err !== null) {
					reject(err); return;
				}

				logger.info(responses)

				resolve(responses);
			});
		});
	};
}
