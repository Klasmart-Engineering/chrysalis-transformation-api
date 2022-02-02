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
import logger from '../utils/logging';
import { UsersToOrganizationSchema } from '../interfaces/backendSchemas';

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
  //AddUsersToClass,
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

        const requestMeta = new RequestMetadata();
        const requestId = uuidv4();
        requestMeta.setId(requestId).setN('1');

        onboardOrgRequest.setOrganization(organization)
          .setRequestId(requestMeta)
          .setAction(Action.CREATE)

        request.addRequests(onboardOrgRequest)
      })

      this._client.onboard(request, (err, response) => {
        if (err !== null) {
          reject(err); return;
        }
        logger.info(response)
        resolve(response);
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

        const requestMeta = new RequestMetadata();
        const requestId = uuidv4();
        requestMeta.setId(requestId).setN('1');

        onboardSchoolRequest.setSchool(schoolProto)
          .setRequestId(requestMeta)
          .setAction(Action.CREATE);
        request.addRequests(onboardSchoolRequest);
      })

      this._client.onboard(request, (err, responses) => {
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

        const requestMeta = new RequestMetadata();
        const requestId = uuidv4();
        requestMeta.setId(requestId).setN('1');

        clazz
          .setName(c.ClassName)
          // .setShortCode(c.ClassShortCode)
          .setExternalUuid(c.ClassUUID)
        //.setExternalOrganizationUuid(c.OrganizationUUID)
        //.setExternalSchoolUuid(c.SchoolUUID);

        onboardClassRequest
          .setClass(clazz)
          .setRequestId(requestMeta)
          .setAction(Action.CREATE);
        request.addRequests(onboardClassRequest);
      });

      this._client.onboard(
        request,
        (err, responses) => {
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
        const requestMeta = new RequestMetadata();
        const requestId = uuidv4();
        requestMeta.setId(requestId).setN('1');

        user
          .setExternalUuid(us.UserUUID)
          .setExternalOrganizationUuid(us.UserUUID) // TODO here should be the org uuid (from cache or from c1 api)
          .setEmail(us.Email)
          .setPhone(us.Phone)
          .setUsername(us.UserFamilyName) // TODO check witch is the username
          .setGivenName(us.UserGivenName)
          .setFamilyName(us.UserFamilyName)
          .setDateOfBirth(us.DateOfBirth)
          .setShortCode(us.UserFamilyName) // TODO: check witch is the shortCode of the user
          .setRoleIdentifiersList(us.KLRoleName);

        if (us.Gender === 'Male') {
          user.setGender(Gender.MALE);
        } else if (us.Gender === 'Female') {
          user.setGender(Gender.FEMALE);
        }
        onboardUserRequest.setUser(user)
          .setRequestId(requestMeta)
          .setAction(Action.CREATE);

        request.addRequests(onboardUserRequest);
      });

      this._client.onboard(request, (err, responses) => {
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
      const requestMeta = new RequestMetadata();
      const requestId = uuidv4();

      requestMeta.setId(requestId).setN('1');
      organization.setName(org.OrganizationName)
        .setExternalUuid(org.OrganizationUUID)

      onboardOrgRequest.setOrganization(organization)
        .setRequestId(requestMeta)
        .setAction(Action.CREATE)

      this._request.addRequests(onboardOrgRequest);
    })
  };

  mapSchoolsToProto(
    schools: SchoolQuerySchema[] = [],
    organizationUuid: string
  ) {
    if (!Array.isArray(schools)) return;

    schools.forEach(async school => {
      const onboardSchoolRequest = new OnboardingRequest()
      const schoolProto = new School()
      const requestMeta = new RequestMetadata();
      const requestId = uuidv4();
      requestMeta.setId(requestId).setN('1');

      schoolProto.setExternalUuid(school.SchoolUUID)
        .setName(school.SchoolName)
        .setShortCode(school.SchoolShortCode)
        .setExternalOrganizationUuid(organizationUuid);

      onboardSchoolRequest.setSchool(schoolProto)
        .setRequestId(requestMeta)
        .setAction(Action.CREATE);

      this._request.addRequests(onboardSchoolRequest);
      this.addProgramsToSchool(organizationUuid,
        school.SchoolUUID,
        school.ProgramName,
        requestId
      );
    })
  };

  mapClassesToProto(
    classes: ClassQuerySchema[] = [],
    organizationUuid: string,
    schoolUuid: string
  ) {
    if (!Array.isArray(classes)) return;
    const classIds: string[] = [];
    classes.forEach(async clazz => {
      classIds.push(clazz.ClassUUID);
      const onboardClassRequest = new OnboardingRequest()
      const classProto = new Class()
      const requestMeta = new RequestMetadata();
      const requestId = uuidv4();
      requestMeta.setId(requestId).setN('1');

      classProto.setExternalUuid(clazz.ClassUUID)
        .setName(clazz.ClassName)
        .setExternalOrganizationUuid(organizationUuid)
        .setExternalSchoolUuid(schoolUuid)
      onboardClassRequest.setClass(classProto)
        .setRequestId(requestMeta)
        .setAction(Action.CREATE);

      this.addProgramsToClass(organizationUuid,
        clazz.ClassUUID,
        clazz.ProgramName,
        requestId
      );
      this._request.addRequests(onboardClassRequest);
    })
    this.addClassesToSchool(
      schoolUuid,
      classIds
    );
  };

  mapUsersToProto(
    users: UserQuerySchema[] = [],
    organizationUuid: string,
    schoolUuid: string
  ) {
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
        .setExternalOrganizationUuid(organizationUuid)
        .setGivenName(us.UserGivenName)
        .setFamilyName(us.UserFamilyName)
        .setDateOfBirth(us.DateOfBirth)
        .setRoleIdentifiersList(us.KLRoleName);

      if (us.Email) {
        user.setEmail(us.Email)
      }
      if (us.Phone) {
        user.setPhone(us.Phone)
      }
      if (us.Username) {
        user.setUsername(us.Username)
      }
      if (us.DateOfBirth) {
        user.setDateOfBirth(us.DateOfBirth)
      }
      if (us.Gender === 'Male') {
        user.setGender(Gender.MALE);
      } else if (us.Gender === 'Female') {
        user.setGender(Gender.FEMALE);
      }
      onboardUserRequest.setUser(user)
        .setRequestId(requestMeta)
        .setAction(Action.CREATE);

      this._request.addRequests(onboardUserRequest);
    });

    this.addUsersToSchool(schoolUuid, userIds);
  }

  addUsersToOrganization(
    usersToOrganization: UsersToOrganizationSchema[]
  ) {
    usersToOrganization.forEach(userToOrg => {
      const requestUuid = uuidv4();
      const onboardRequest = new OnboardingRequest();
      const linkUsers = new Link();
      const addUsersToOrganization = new AddUsersToOrganization();
      const requestMeta = new RequestMetadata();

      requestMeta.setId(requestUuid).setN('1');
      addUsersToOrganization
        .setRoleIdentifiersList(userToOrg.RoleIdentifiers)
        .setExternalUserUuidsList(userToOrg.ExternalUserUUIDs)
        .setExternalOrganizationUuid(userToOrg.ExternalOrganizationUUID);

      linkUsers.setAddUsersToOrganization(addUsersToOrganization);
      onboardRequest.setLinkEntities(linkUsers).setRequestId(requestMeta);

      this._request.addRequests(onboardRequest);
    });
  }

  private addProgramsToSchool(
    organizationUuid: string,
    schoolUuid: string,
    programNames: string[],
    requestUuid: string
  ) {
    const onboardRequest = new OnboardingRequest()
    const linkPrograms = new Link();
    const addProgramsToSchool = new AddProgramsToSchool();
    const requestMeta = new RequestMetadata();

    requestMeta.setId(requestUuid).setN('2');
    addProgramsToSchool
      .setExternalOrganizationUuid(organizationUuid)
      .setExternalSchoolUuid(schoolUuid)
      .setProgramNamesList(programNames);

    linkPrograms.setAddProgramsToSchool(addProgramsToSchool);
    onboardRequest.setLinkEntities(linkPrograms).setRequestId(requestMeta);

    this._request.addRequests(onboardRequest)
  }

  private addClassesToSchool(
    schoolUuid: string,
    classIds: string[],
  ) {
    const onboardRequest = new OnboardingRequest()
    const linkClasses = new Link();
    const addClassesToSchool = new AddClassesToSchool();
    const requestMeta = new RequestMetadata();
    const requestId = uuidv4();
    requestMeta.setId(requestId).setN('1');
    addClassesToSchool
      .setExternalSchoolUuid(schoolUuid)
      .setExternalClassUuidsList(classIds);

    linkClasses.setAddClassesToSchool(addClassesToSchool);
    onboardRequest.setLinkEntities(linkClasses).setRequestId(requestMeta);

    this._request.addRequests(onboardRequest)
  }

  private addProgramsToClass(
    organizationUuid: string,
    classUuid: string,
    programNames: string[],
    requestUuid: string
  ) {
    const onboardRequest = new OnboardingRequest()
    const linkPrograms = new Link();
    const addProgramsToClass = new AddProgramsToClass();
    const requestMeta = new RequestMetadata();

    requestMeta.setId(requestUuid).setN('2');
    addProgramsToClass
      .setExternalOrganizationUuid(organizationUuid)
      .setExternalClassUuid(classUuid)
      .setProgramNamesList(programNames);

    linkPrograms.setAddProgramsToClass(addProgramsToClass);
    onboardRequest.setLinkEntities(linkPrograms).setRequestId(requestMeta);

    this._request.addRequests(onboardRequest)
  }

  private addUsersToSchool(
    schoolUuid: string,
    userIds: string[],
  ) {
    const onboardRequest = new OnboardingRequest()
    const linkUsers = new Link();
    const addUsersToSchool = new AddUsersToSchool();
    const requestMeta = new RequestMetadata();
    const requestId = uuidv4();
    requestMeta.setId(requestId).setN('1');
    addUsersToSchool
      .setExternalSchoolUuid(schoolUuid)
      .setExternalUserUuidsList(userIds);

    linkUsers.setAddUsersToSchool(addUsersToSchool);
    onboardRequest.setLinkEntities(linkUsers).setRequestId(requestMeta);

    this._request.addRequests(onboardRequest)
  }

  async sendRequest() {
    return new Promise((resolve, reject) => {
      this._client.onboard(this._request, (err, responses) => {
        if (err !== null) {
          reject(err); return;
        }
        logger.info(responses)
        resolve(responses);
      });
    })
  }
}
