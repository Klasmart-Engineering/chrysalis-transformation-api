
import { OrganizationQuerySchema, UserQuerySchema,SchoolQuerySchema } from '../interfaces/clientSchemas';
import { v4 as uuidv4 } from 'uuid'
import { grpc, proto } from 'cil-lib'
import { InterceptorOptions, NextCall } from '@grpc/grpc-js/build/src/client-interceptors'
import { InterceptingListener } from '@grpc/grpc-js/build/src/call-stream'
import { Metadata } from '@grpc/grpc-js/build/src/metadata'
import { Responses } from "cil-lib/dist/main/lib/protos";
import logger from '../utils/logging';
import { ServiceError } from '@grpc/grpc-js';

const { Action, BatchOnboarding, OnboardingRequest, Organization, User, School } = proto;

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
				const channel: grpc.ChannelCredentials = grpc.ChannelCredentials.createInsecure() as grpc.ChannelCredentials
				const interceptor = (options: InterceptorOptions, nextCall: NextCall) => {
					const requester = {
						start(metadata: Metadata, listener: Partial<InterceptingListener>, next: CallableFunction) {
							metadata.add('x-api-key', String(process.env.BACKEND_API_SECRET))
							next(metadata, listener)
						}
					}

					return new grpc.InterceptingCall(nextCall(options), requester);
				}

				const client = new proto.OnboardingClient(String(process.env.BACKEND_API_URL), channel, { interceptors: [interceptor] })
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
					.setRequestId(uuidv4())
					.setAction(Action.CREATE)

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

	async onboardSchools(organizationUuid: string, schools: SchoolQuerySchema[] = []) {
		return new Promise((resolve, reject) => {
			const request = new BatchOnboarding();

			schools.forEach(async school => {
				const onboardSchoolRequest = new OnboardingRequest()
				const schoolProto = new School()
				schoolProto.setExternalUuid(school.SchoolUUID)
					.setName(school.SchoolName)
					.setShortCode(school.SchoolShortCode)
					.setExternalOrganizationUuid(organizationUuid);

				onboardSchoolRequest.setSchool(schoolProto)
					.setRequestId(uuidv4())
					.setAction(Action.CREATE);
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

  async onboardUsers(users: UserQuerySchema[] = []) {
    return new Promise((resolve, reject) => {
      const request = new BatchOnboarding();

      users.forEach((us) => {
        const onboardUserRequest = new OnboardingRequest();
        const user = new User();

        user
          .setExternalUuid(us.UserUUID)
          .setExternalOrganizationUuid(us.UserUUID) // TODO here should be the org uuid (from cache or from c1 api)
          .setEmail(us.Email)
          .setPhone(us.Phone)
          .setUsername(us.UserFamilyName) // TODO check witch is the username
          .setGivenName(us.UserGivenName)
          .setFamilyName(us.UserFamilyName)
          .setGender(us.Gender)
          .setDateOfBirth(us.DateOfBirth)
          .setShortCode(us.UserFamilyName) // TODO: check witch is the shortCode of the user
          .setRoleIdentifiersList(us.KLRoleName);

          onboardUserRequest.setUser(user)
          .setRequestId(uuidv4())
          .setAction(Action.CREATE);
          
        request.addRequests(onboardUserRequest);
      });

      this._client.onboard(request, (err, responses: Responses) => {
        if (err != null) {
          reject(err);
          return;
        }

        logger.info(responses);

        resolve(responses);
      });
    });
  }
}
