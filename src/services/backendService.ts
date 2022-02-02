import {
  OrganizationQuerySchema,
  UserQuerySchema,
  SchoolQuerySchema,
  ClassQuerySchema
} from '../interfaces/clientSchemas';
import { v4 as uuidv4 } from 'uuid'
import { grpc, proto } from 'cil-lib'
import { InterceptorOptions, NextCall } from '@grpc/grpc-js/build/src/client-interceptors'
import { InterceptingListener } from '@grpc/grpc-js/build/src/call-stream'
import { Metadata } from '@grpc/grpc-js/build/src/metadata'
import { Responses } from "cil-lib/dist/main/lib/protos";
import logger from '../utils/logging';
import { ServiceError } from '@grpc/grpc-js';

const { 
  Action, 
  BatchOnboarding, 
  OnboardingRequest, 
  Organization, 
  User, 
  School,
  Class,
  Link, 
  AddProgramsToSchool
} = proto;

export class BackendService {
	private _client: proto.OnboardingClient;
	private static _instance: BackendService;
  private _request: proto.BatchOnboarding = new BatchOnboarding();

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
      const request: proto.BatchOnboarding = new BatchOnboarding();

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

  async onboardClasses(classes: ClassQuerySchema[] = []) {
    return new Promise((resolve, reject) => {
      const request = new BatchOnboarding();

      classes.forEach((c) => {
        const onboardClassRequest = new OnboardingRequest();
        const clazz = new Class();

        clazz
          .setName(c.ClassName)
          // .setShortCode(c.ClassShortCode)
          .setExternalUuid(c.ClassUUID)
          //.setExternalOrganizationUuid(c.OrganizationUUID)
          //.setExternalSchoolUuid(c.SchoolUUID);

        onboardClassRequest
          .setClass(clazz)
          .setRequestId(uuidv4())
          .setAction(Action.CREATE);
        request.addRequests(onboardClassRequest);
      });

      this._client.onboard(
        request,
        (err: ServiceError | null, responses: Responses) => {
          if (err != null) {
            reject(err);
            return;
          }

          logger.info(responses);

          resolve(responses);
        }
      );
    });
  }

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

  mapOrganizationsToProto(organizations: OrganizationQuerySchema[] = []) {
    organizations.forEach(org => {
      const onboardOrgRequest = new OnboardingRequest()
      const organization = new Organization()

      organization.setName(org.OrganizationName)
        .setExternalUuid(org.OrganizationUUID)

      onboardOrgRequest.setOrganization(organization)
        .setRequestId(uuidv4())
        .setAction(Action.CREATE)

      this._request.addRequests(onboardOrgRequest);
    })
	};

  mapSchoolsToProto(schools: SchoolQuerySchema[] = [], organizationUuid: string) {
    if (!Array.isArray(schools)) return;
    
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

      this._request.addRequests(onboardSchoolRequest);
      this.addProgramToSchool(organizationUuid, school.SchoolUUID, school.ProgramName);
    })
	};

  mapUsersToProto(users: UserQuerySchema[] = [], organizationUuid: string) {
    users.forEach((us) => {
      const onboardUserRequest = new OnboardingRequest();
      const user = new User();

      user
        .setExternalUuid(us.UserUUID)
        .setExternalOrganizationUuid(organizationUuid)
        .setEmail('ionut@test.com')
        .setPhone(us.Phone)
        .setUsername('username') // TODO check witch is the username
        .setGivenName(us.UserGivenName)
        .setFamilyName(us.UserFamilyName)
        .setGender(us.Gender)
        .setDateOfBirth(us.DateOfBirth)
        .setShortCode('shortCode')
        .setRoleIdentifiersList(us.KLRoleName);

        onboardUserRequest.setUser(user)
          .setRequestId(uuidv4())
          .setAction(Action.CREATE);
      
      this._request.addRequests(onboardUserRequest);
    });
  }

  private addProgramToSchool(
    organizationUuid: string, 
    schoolUuid: string,
    programNames: string[]
  ) {
    const onboardRequest = new OnboardingRequest()
    const linkPrograms = new Link();
    const addProgramsToSchool = new AddProgramsToSchool();

    addProgramsToSchool
      .setExternalOrganizationUuid(organizationUuid)
      .setExternalSchoolUuid(schoolUuid)
      .setProgramNamesList(programNames);
    
    linkPrograms.setAddProgramsToSchool(addProgramsToSchool);
    // TODO check if need to add reqId and action
    onboardRequest.setLinkEntities(linkPrograms);

    this._request.addRequests(onboardRequest)
  }

  async sendRequest() {
    return new Promise((resolve, reject) => {
      this._client.onboard(this._request, (err: ServiceError | null, responses: Responses) => {
        if (err !== null) {
          reject(err); return;
        }
  
        logger.info(responses)
  
        resolve(responses);
      });
    })
  }
}
