import { BackendResponse, BackendResponses } from '../interfaces/backendResponse';
import * as proto from '../protos/api_pb';
import { BackendService } from '../services/backendService';
import { 
  ClassQuerySchema,
  Feedback,
  FeedbackResponse,
  OrganizationQuerySchema, 
  SchoolQuerySchema, 
  UserQuerySchema 
} from '../interfaces/clientSchemas';
import {requestIds} from "../config/requestIds";
import { AlreadyProcessedResponse } from './httpResponses';

let messages: string[] = [];
const messageKey = 'detailsList';

export enum Entity {
  ORGANIZATION = 'Organization',
  SCHOOL = 'School',
  CLASS = 'Class',
  USER = 'User',
  ROLE = 'Role',
  PROGRAM = 'Program',
  UNKNOWN = 'Unknown',
}

export type Entities = OrganizationQuerySchema[] | SchoolQuerySchema[] | ClassQuerySchema[] | UserQuerySchema[];

export async function parseResponse() {
  const backendService = BackendService.getInstance();
  const response = (await backendService.sendRequest()) as BackendResponses;
  let statusCode = 400;

  response.responsesList.forEach((rsp: BackendResponse) => {
    rsp.entityName = protobufToEntity(rsp.entity);
  });
  
  const feedback = generateFeedback(response);
  
  feedback.forEach((item: Feedback) => {
    if (item.HasSuccess) {
      statusCode = 200;
    }

    if (item.ErrorMessage.length) {
      item.ErrorMessage = Array.from(new Set(item.ErrorMessage))
    }
  });

  return { statusCode, response, feedback }
}

const generateFeedback = (responses: BackendResponses) => {
  const mappedResponses: Array<{ entityId: string, entityName: string, responses: BackendResponse[] }> = [];

  responses.responsesList.forEach(el => {
    const entityExists = mappedResponses.find(
      item => item.entityId.toLowerCase() === el.entityId.toLowerCase()
    );

    if (entityExists) {
      entityExists.responses.push(el);
    } else {
      mappedResponses.push({ entityId: el.entityId, entityName: el.entityName, responses: [el] })
    }
  });

  const feedback: Feedback[] = [];

  mappedResponses.forEach(entity => {
    const isOnboard = processFeedback(entity.responses);

    feedback.push(
      {
        UUID: entity.entityId,
        Entity: entity.entityName,
        HasSuccess: isOnboard,
        ErrorMessage: isOnboard ? [] : processErrors(entity.responses),
      }
    );
  });

  return feedback;
}

const processFeedback = (
  responses: BackendResponse[]
) => {
  const isOnboard = [];
  for (const response of responses) {
    isOnboard.push((response.success || typeof response.errors?.entityAlreadyExists === 'object'));
  }

  return !isOnboard.includes(false);
}

const processErrors = (
  responses: BackendResponse[]
) => {
  const errorMessages = [];
  for (const response of responses) {
    if (!response.success) {
      const action = Object.keys(requestIds)[Object.values(requestIds).indexOf(response.requestId.id)]
      errorMessages.push(
        ...mapErrors(response.errors)
        .map(error => `${action}: ${error.normalize('NFKC')}`)
      );
      messages = [];
    }
  }
  return errorMessages;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapErrors = (errors: any) => {
  if (!messages) messages = [];

  const localErrors = {...errors}

  if (localErrors instanceof Object) {
    const objectKeys = Object.keys(localErrors);

    // remove already exist error messages
    objectKeys.forEach(key => {
      if (key === 'entityAlreadyExists') {
        delete localErrors[key];
      }
    });

    if (objectKeys.includes(messageKey)) {
      messages = [...messages, ...localErrors[messageKey]];
    } else {
      for (const key in errors) {
        if (localErrors[key] instanceof Object) mapErrors(localErrors[key]);
      }
    }
  }

  return messages;
}

export function protobufToEntity(e: proto.Entity): Entity {
  switch (e) {
    case proto.Entity.ORGANIZATION:
      return Entity.ORGANIZATION;
    case proto.Entity.SCHOOL:
      return Entity.SCHOOL;
    case proto.Entity.CLASS:
      return Entity.CLASS;
    case proto.Entity.USER:
      return Entity.USER;
    case proto.Entity.PROGRAM:
      return Entity.PROGRAM;
    case proto.Entity.ROLE:
      return Entity.ROLE;
    default:
      throw new Error(
        'Unable to map protobuf Entity to app Entity'
      );
  }
}

export const alreadyProcess = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entities: any[] | null,
  entityName: Entity.SCHOOL | Entity.CLASS | Entity.USER,
  feedback: FeedbackResponse[] = []
) => {
  const pluralName = getPluralName(entityName);
  
  if (!entities) {
    return new AlreadyProcessedResponse(`${ pluralName } already processed`, [], []);
  }

  const uuidKey = getUuidKey(entityName);

  const response = new AlreadyProcessedResponse();
  
  const message = `${ pluralName } already processed however c1 api is returning processed entities`;
  const alreadyProcessed = entities.map(entity => { return {[uuidKey]: entity[uuidKey]} });

  response._message = message;
  response._alreadyProcessed = alreadyProcessed;
  response._feedback = feedback;

  return response.instance;
}

export const getPluralName = (entityName: string) => {
  switch (entityName) {
    case Entity.SCHOOL:
      return 'Schools'
    case Entity.CLASS:
      return 'Classes'
    case Entity.USER:
      return 'Users'
    default:
      return 'Entities'
  }
}

const getUuidKey = (entityName: string) => {
  switch (entityName) {
    case Entity.SCHOOL:
      return 'SchoolUUID'
    case Entity.CLASS:
      return 'ClassUUID'
    case Entity.USER:
      return 'UserUUID'
    default:
      return 'UUID'
  }
}