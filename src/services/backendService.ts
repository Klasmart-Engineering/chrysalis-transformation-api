import {
  OrganizationQuerySchema,
  UserQuerySchema,
  SchoolQuerySchema,
  ClassQuerySchema,
} from '../interfaces/clientSchemas';
import newrelic from 'newrelic';
import * as proto from '../protos/api_pb';
import { OnboardingClient } from '../protos/api_grpc_pb';
import * as grpc from '@grpc/grpc-js';
import {
  InterceptorOptions,
  NextCall,
} from '@grpc/grpc-js/build/src/client-interceptors';
import { InterceptingListener } from '@grpc/grpc-js/build/src/call-stream';
import { Metadata } from '@grpc/grpc-js/build/src/metadata';
import { log } from '../utils/logging';
import {
  UsersToClassSchema,
  UsersToOrganizationSchema,
} from '../interfaces/backendSchemas';
import { requestIds } from '../config/requestIds';

const {
  Action,
  BatchOnboarding,
  OnboardingRequest,
  Organization,
  User,
  School,
  Class,
  Link,
  Gender,
  RequestMetadata,
  AddProgramsToSchool,
  AddClassesToSchool,
  AddProgramsToClass,
  AddUsersToOrganization,
  AddUsersToClass,
  AddUsersToSchool,
} = proto;

export class BackendService {
  private _client: OnboardingClient;
  private static _instance: BackendService;
  private _request: proto.BatchOnboarding = new BatchOnboarding();

  private constructor(client: OnboardingClient) {
    this._client = client;
  }

  get client(): OnboardingClient {
    return this._client;
  }

  public static getInstance() {
    try {
      if (this._instance) {
        return this._instance;
      } else {
        const channel: grpc.ChannelCredentials =
          process.env.NODE_ENV == 'development'
            ? (grpc.ChannelCredentials.createInsecure() as grpc.ChannelCredentials)
            : (grpc.ChannelCredentials.createSsl() as grpc.ChannelCredentials);
        const interceptor = (
          options: InterceptorOptions,
          nextCall: NextCall
        ) => {
          const requester = {
            start(
              metadata: Metadata,
              listener: Partial<InterceptingListener>,
              next: CallableFunction
            ) {
              metadata.add('x-api-key', String(process.env.BACKEND_API_SECRET));
              const headers = {};
              const transaction = newrelic.getTransaction();
              transaction.insertDistributedTraceHeaders(headers);
              for (const [k, v] of Object.entries(headers))
                metadata.add(k, v as grpc.MetadataValue);
              next(metadata, listener);
            },
          };

          return new grpc.InterceptingCall(nextCall(options), requester);
        };

        const client = new OnboardingClient(
          String(process.env.BACKEND_API_URL),
          channel,
          { interceptors: [interceptor] }
        );
        this._instance = new BackendService(client);
        log.info('Connected to Generic backend');
        return this._instance;
      }
    } catch (e) {
      log.error(
        { error: e, targetApi: 'Generic Backend' },
        '❌ Failed to connect to Generic backend'
      );
      throw e;
    }
  }

  public resetRequest() {
    this._request.clearRequestsList();
  }

  mapOrganizationsToProto(organizations: OrganizationQuerySchema[] = []) {
    organizations.forEach((org) => {
      const onboardOrgRequest = new OnboardingRequest();
      const organization = new Organization();
      const requestMeta = new RequestMetadata();
      requestMeta.setId(requestIds.CREATE_ORG).setN('1');
      organization
        .setName(org.OrganizationName)
        .setExternalUuid(org.OrganizationUUID);

      onboardOrgRequest
        .setOrganization(organization)
        .setRequestId(requestMeta)
        .setAction(Action.CREATE);

      this._request.addRequests(onboardOrgRequest);
    });
  }

  mapSchoolsToProto(schools: SchoolQuerySchema[] = []) {
    if (!Array.isArray(schools)) return;

    schools.forEach(async (school) => {
      const onboardSchoolRequest = new OnboardingRequest();
      const schoolProto = new School();
      const requestMeta = new RequestMetadata();
      requestMeta.setId(requestIds.CREATE_SCHOOL).setN('1');

      schoolProto
        .setExternalUuid(school.SchoolUUID)
        .setName(school.SchoolName)
        .setShortCode(school.SchoolShortCode)
        .setExternalOrganizationUuid(school.OrganizationUUID);

      onboardSchoolRequest
        .setSchool(schoolProto)
        .setRequestId(requestMeta)
        .setAction(Action.CREATE);

      this._request.addRequests(onboardSchoolRequest);
      this.addProgramsToSchool(school, '2');
    });
  }

  mapClassesToProto(classes: ClassQuerySchema[] = []) {
    if (!Array.isArray(classes)) return;
    classes.forEach(async (clazz) => {
      const onboardClassRequest = new OnboardingRequest();
      const classProto = new Class();
      const requestMeta = new RequestMetadata();
      requestMeta.setId(requestIds.CREATE_CLASS).setN('1');

      classProto
        .setExternalUuid(clazz.ClassUUID)
        .setName(clazz.ClassName)
        .setExternalOrganizationUuid(clazz.OrganizationUUID)
        .setExternalSchoolUuid(clazz.SchoolUUID);
      onboardClassRequest
        .setClass(classProto)
        .setRequestId(requestMeta)
        .setAction(Action.CREATE);

      this.addProgramsToClass(clazz, '2');
      this._request.addRequests(onboardClassRequest);
    });
  }

  mapUsersToProto(users: UserQuerySchema[] = []) {
    users.forEach((us) => {
      const onboardUserRequest = new OnboardingRequest();
      const user = new User();
      const requestMeta = new RequestMetadata();
      requestMeta.setId(requestIds.CREATE_USER).setN('1');
      user
        .setExternalUuid(us.UserUUID)
        .setExternalOrganizationUuid(us.OrganizationUUID)
        .setGivenName(us.UserGivenName)
        .setFamilyName(us.UserFamilyName)
        .setDateOfBirth(us.DateOfBirth)
        .setRoleIdentifiersList(us.KLRoleName);

      if (us.Email) {
        user.setEmail(us.Email);
      }
      if (us.Phone) {
        user.setPhone(us.Phone);
      }
      if (us.Username) {
        user.setUsername(us.Username);
      }
      if (us.DateOfBirth) {
        user.setDateOfBirth(us.DateOfBirth);
      }
      if (us.Gender === 'Male') {
        user.setGender(Gender.MALE);
      } else if (us.Gender === 'Female') {
        user.setGender(Gender.FEMALE);
      }
      onboardUserRequest
        .setUser(user)
        .setRequestId(requestMeta)
        .setAction(Action.CREATE);

      this._request.addRequests(onboardUserRequest);
    });
  }

  private addProgramsToSchool(school: SchoolQuerySchema, n: string) {
    const onboardRequest = new OnboardingRequest();
    const linkPrograms = new Link();
    const addProgramsToSchool = new AddProgramsToSchool();
    const requestMeta = new RequestMetadata();

    requestMeta.setId(requestIds.ADD_PROGRAMS_TO_SCHOOL).setN(n);
    addProgramsToSchool
      .setExternalSchoolUuid(school.SchoolUUID)
      .setProgramNamesList(school.ProgramName);

    linkPrograms.setAddProgramsToSchool(addProgramsToSchool);
    onboardRequest.setLinkEntities(linkPrograms).setRequestId(requestMeta);

    this._request.addRequests(onboardRequest);
  }

  addClassesToSchool(schoolUuid: string, classIds: string[], n: string) {
    const onboardRequest = new OnboardingRequest();
    const linkClasses = new Link();
    const addClassesToSchool = new AddClassesToSchool();
    const requestMeta = new RequestMetadata();
    requestMeta.setId(requestIds.ADD_CLASSES_TO_SCHOOL).setN(n);
    addClassesToSchool
      .setExternalSchoolUuid(schoolUuid)
      .setExternalClassUuidsList(classIds);

    linkClasses.setAddClassesToSchool(addClassesToSchool);
    onboardRequest.setLinkEntities(linkClasses).setRequestId(requestMeta);

    this._request.addRequests(onboardRequest);
  }

  private addProgramsToClass(clazz: ClassQuerySchema, n: string) {
    const onboardRequest = new OnboardingRequest();
    const linkPrograms = new Link();
    const addProgramsToClass = new AddProgramsToClass();
    const requestMeta = new RequestMetadata();

    requestMeta.setId(requestIds.ADD_PROGRAMS_TO_CLASS).setN(n);
    addProgramsToClass
      .setExternalClassUuid(clazz.ClassUUID)
      .setProgramNamesList(clazz.ProgramName);

    linkPrograms.setAddProgramsToClass(addProgramsToClass);
    onboardRequest.setLinkEntities(linkPrograms).setRequestId(requestMeta);

    this._request.addRequests(onboardRequest);
  }

  addUsersToSchool(schoolUuid: string, userIds: string[], n: string) {
    const onboardRequest = new OnboardingRequest();
    const linkUsers = new Link();
    const addUsersToSchool = new AddUsersToSchool();
    const requestMeta = new RequestMetadata();
    requestMeta.setId(requestIds.ADD_USERS_TO_SCHOOL).setN(n);
    addUsersToSchool
      .setExternalSchoolUuid(schoolUuid)
      .setExternalUserUuidsList(userIds);

    linkUsers.setAddUsersToSchool(addUsersToSchool);
    onboardRequest.setLinkEntities(linkUsers).setRequestId(requestMeta);

    this._request.addRequests(onboardRequest);
  }

  addUsersToOrganization(
    usersToOrganization: UsersToOrganizationSchema[],
    n: string
  ) {
    usersToOrganization.forEach((userToOrg) => {
      const onboardRequest = new OnboardingRequest();
      const linkUsers = new Link();
      const addUsersToOrganization = new AddUsersToOrganization();
      const requestMeta = new RequestMetadata();

      requestMeta.setId(requestIds.ADD_USERS_TO_ORG).setN(n);
      addUsersToOrganization
        .setRoleIdentifiersList(userToOrg.RoleIdentifiers)
        .setExternalUserUuidsList(userToOrg.ExternalUserUUIDs)
        .setExternalOrganizationUuid(userToOrg.ExternalOrganizationUUID);

      linkUsers.setAddUsersToOrganization(addUsersToOrganization);
      onboardRequest.setLinkEntities(linkUsers).setRequestId(requestMeta);

      this._request.addRequests(onboardRequest);
    });
  }

  addUsersToClasses(usersToClasses: UsersToClassSchema[], n: string) {
    usersToClasses.forEach((usersToClass) => {
      const onboardRequest = new OnboardingRequest();
      const linkUsers = new Link();
      const addUsersToClass = new AddUsersToClass();
      const requestMeta = new RequestMetadata();

      requestMeta.setId(requestIds.ADD_USERS_TO_CLASS).setN(n);
      addUsersToClass
        .setExternalClassUuid(usersToClass.ExternalClassUUID)
        .setExternalStudentUuidList(usersToClass.ExternalStudentUUIDs)
        .setExternalTeacherUuidList(usersToClass.ExternalTeacherUUIDs);

      linkUsers.setAddUsersToClass(addUsersToClass);
      onboardRequest.setLinkEntities(linkUsers).setRequestId(requestMeta);

      this._request.addRequests(onboardRequest);
    });
  }

  async sendRequest() {
    return new Promise((resolve, reject) => {
      this._client.onboard(this._request, (err, responses) => {
        if (err !== null) {
          reject(err);
          return;
        }
        log.info(responses.toObject());
        resolve(responses.toObject());
      });
    });
  }
}
