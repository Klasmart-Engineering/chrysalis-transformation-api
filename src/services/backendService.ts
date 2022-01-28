import { ServiceError } from '@grpc/grpc-js';
import {
  InterceptorOptions,
  NextCall,
} from '@grpc/grpc-js/build/src/client-interceptors';
import { InterceptingListener } from '@grpc/grpc-js/build/src/call-stream';
import { Metadata } from '@grpc/grpc-js/build/src/metadata';
import { v4 as uuidv4 } from 'uuid';
import { grpc, proto } from 'cil-lib';
import { Responses } from 'cil-lib/dist/main/lib/protos';
import { ClassQuerySchema } from '../interfaces/c1Schemas';
import logger from '../utils/logging';

const { Action, BatchOnboarding, OnboardingRequest, Class } = proto;

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
        logger.info('Connected to Generic Backend');
        return this._instance;
      }
    } catch (e) {
      logger.error('❌ Failed to connect to Generic Backend');
      throw e;
    }
  }

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
          .setExternalOrganizationUuid(c.OrganizationUUID)
          .setExternalSchoolUuid(c.SchoolUUID);

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
}
