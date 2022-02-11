import {
  OrganizationQuerySchema,
  UserQuerySchema,
  SchoolQuerySchema,
  ClassQuerySchema,
} from '../interfaces/clientSchemas';
import { v4 as uuidv4 } from 'uuid';
import { grpc, proto } from 'cil-lib';
import {
  InterceptorOptions,
  NextCall,
} from '@grpc/grpc-js/build/src/client-interceptors';
import { InterceptingListener } from '@grpc/grpc-js/build/src/call-stream';
import { Metadata } from '@grpc/grpc-js/build/src/metadata';
import logger from '../utils/logging';
import {
  UsersToClassSchema,
  UsersToOrganizationSchema,
} from '../interfaces/backendSchemas';

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
  //AddOrganizationRolesToUser
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
        const channel: grpc.ChannelCredentials =
          grpc.ChannelCredentials.createInsecure() as grpc.ChannelCredentials;
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
              next(metadata, listener);
            },
          };

          return new grpc.InterceptingCall(nextCall(options), requester);
        };

        const client = new proto.OnboardingClient(
          String(process.env.BACKEND_API_URL),
          channel,
          { interceptors: [interceptor] }
        );
        this._instance = new BackendService(client);
        logger.info('Connected to Generic backend');
        return this._instance;
      }
    } catch (e) {
      logger.error('❌ Failed to connect to Generic backend');
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
      requestMeta.setId(org.OrganizationUUID).setN('1');
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
      requestMeta.setId(school.SchoolUUID).setN('1');

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
      this.addProgramsToSchool(school);
    });
  }

  mapClassesToProto(classes: ClassQuerySchema[] = []) {
    if (!Array.isArray(classes)) return;
    const classIds: string[] = [];
    const schoolUuid = classes[0].SchoolUUID;
    classes.forEach(async (clazz) => {
      classIds.push(clazz.ClassUUID);
      const onboardClassRequest = new OnboardingRequest();
      const classProto = new Class();
      const requestMeta = new RequestMetadata();
      const requestId = uuidv4();
      requestMeta.setId(requestId).setN('1');

      classProto
        .setExternalUuid(clazz.ClassUUID)
        .setName(clazz.ClassName)
        .setExternalOrganizationUuid(clazz.OrganizationUUID)
        .setExternalSchoolUuid(clazz.SchoolUUID);
      onboardClassRequest
        .setClass(classProto)
        .setRequestId(requestMeta)
        .setAction(Action.CREATE);

      this.addProgramsToClass(clazz, requestId);
      this._request.addRequests(onboardClassRequest);
    });
    this.addClassesToSchool(schoolUuid, classIds);
  }

  mapUsersToProto(users: UserQuerySchema[] = [], schoolUuid: string) {
    const userIds: string[] = [];
    users.forEach((us) => {
      userIds.push(us.UserUUID);
      const onboardUserRequest = new OnboardingRequest();
      const user = new User();
      const requestMeta = new RequestMetadata();
      const requestId = uuidv4();
      requestMeta.setId(requestId).setN('1');
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

    this.addUsersToSchool(schoolUuid, userIds);
  }

  private addProgramsToSchool(school: SchoolQuerySchema) {
    const onboardRequest = new OnboardingRequest();
    const linkPrograms = new Link();
    const addProgramsToSchool = new AddProgramsToSchool();
    const requestMeta = new RequestMetadata();

    requestMeta.setId(school.SchoolUUID).setN('2');
    addProgramsToSchool
      .setExternalOrganizationUuid(school.OrganizationUUID)
      .setExternalSchoolUuid(school.SchoolUUID)
      .setProgramNamesList(school.ProgramName);

    linkPrograms.setAddProgramsToSchool(addProgramsToSchool);
    onboardRequest.setLinkEntities(linkPrograms).setRequestId(requestMeta);

    this._request.addRequests(onboardRequest);
  }

  private addClassesToSchool(schoolUuid: string, classIds: string[]) {
    const onboardRequest = new OnboardingRequest();
    const linkClasses = new Link();
    const addClassesToSchool = new AddClassesToSchool();
    const requestMeta = new RequestMetadata();
    requestMeta.setId(schoolUuid).setN('3');
    addClassesToSchool
      .setExternalSchoolUuid(schoolUuid)
      .setExternalClassUuidsList(classIds);

    linkClasses.setAddClassesToSchool(addClassesToSchool);
    onboardRequest.setLinkEntities(linkClasses).setRequestId(requestMeta);

    this._request.addRequests(onboardRequest);
  }

  private addProgramsToClass(clazz: ClassQuerySchema, requestUuid: string) {
    const onboardRequest = new OnboardingRequest();
    const linkPrograms = new Link();
    const addProgramsToClass = new AddProgramsToClass();
    const requestMeta = new RequestMetadata();

    requestMeta.setId(requestUuid).setN('2');
    addProgramsToClass
      .setExternalOrganizationUuid(clazz.OrganizationUUID)
      .setExternalClassUuid(clazz.ClassUUID)
      .setProgramNamesList(clazz.ProgramName);

    linkPrograms.setAddProgramsToClass(addProgramsToClass);
    onboardRequest.setLinkEntities(linkPrograms).setRequestId(requestMeta);

    this._request.addRequests(onboardRequest);
  }

  private addUsersToSchool(schoolUuid: string, userIds: string[]) {
    const onboardRequest = new OnboardingRequest();
    const linkUsers = new Link();
    const addUsersToSchool = new AddUsersToSchool();
    const requestMeta = new RequestMetadata();
    const requestId = uuidv4();
    requestMeta.setId(requestId).setN('2');
    addUsersToSchool
      .setExternalSchoolUuid(schoolUuid)
      .setExternalUserUuidsList(userIds);

    linkUsers.setAddUsersToSchool(addUsersToSchool);
    onboardRequest.setLinkEntities(linkUsers).setRequestId(requestMeta);

    this._request.addRequests(onboardRequest);
  }

  addUsersToOrganization(usersToOrganization: UsersToOrganizationSchema[]) {
    usersToOrganization.forEach((userToOrg) => {
      const requestUuid = uuidv4();
      const onboardRequest = new OnboardingRequest();
      const linkUsers = new Link();
      const addUsersToOrganization = new AddUsersToOrganization();
      const requestMeta = new RequestMetadata();

      requestMeta.setId(requestUuid).setN('4');
      addUsersToOrganization
        .setRoleIdentifiersList(userToOrg.RoleIdentifiers)
        .setExternalUserUuidsList(userToOrg.ExternalUserUUIDs)
        .setExternalOrganizationUuid(userToOrg.ExternalOrganizationUUID);

      linkUsers.setAddUsersToOrganization(addUsersToOrganization);
      onboardRequest.setLinkEntities(linkUsers).setRequestId(requestMeta);

      this._request.addRequests(onboardRequest);
    });
  }

  addUsersToClasses(usersToClasses: UsersToClassSchema[]) {
    usersToClasses.forEach((usersToClass) => {
      const requestUuid = uuidv4();
      const onboardRequest = new OnboardingRequest();
      const linkUsers = new Link();
      const addUsersToClass = new AddUsersToClass();
      const requestMeta = new RequestMetadata();

      requestMeta.setId(requestUuid).setN('3');
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
        logger.info(responses.toObject());
        resolve(responses.toObject());
      });
    });
  }
}
