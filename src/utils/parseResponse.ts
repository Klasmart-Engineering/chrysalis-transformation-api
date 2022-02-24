import { BackendResponse, BackendResponses } from '../interfaces/backendResponse';
import { log, protobufToEntity } from 'cil-lib';
import { BackendService } from '../services/backendService';
import { Feedback } from '../interfaces/clientSchemas';

let messages: string[] = [];
const messageKey = 'detailsList';

export async function parseResponse() {
  const backendService = BackendService.getInstance();
  const response = (await backendService.sendRequest()) as BackendResponses;
  let statusCode = 400;
  response.responsesList.forEach((rsp: BackendResponse) => {
    rsp.entityName = protobufToEntity(rsp.entity, log);
    if (rsp.success) {
      statusCode = 200;
    }
  });
  const feedback = generateFeedback(response);
  return { statusCode, response, feedback}
}

const generateFeedback = (responses: BackendResponses) => {
  const mappedResponses: Array<{entityId: string, entityName: string, responses: BackendResponse[]}> = [];

  responses.responsesList.forEach(el => {
    const entityExists = mappedResponses.find(item => item.entityId === el.entityId)
    if (entityExists) {
      entityExists.responses.push(el);
    } else {
      mappedResponses.push({ entityId: el.entityId, entityName: el.entityName, responses: [el] })
    }
  });

  const feedback: Feedback[] = [];

  mappedResponses.forEach(entity => {
    const isOnboard = processFeedback(entity.responses);

    if (isOnboard) {
      feedback.push(
        {
          UUID: entity.entityId,
          Entity: entity.entityName,
          HasSuccess: isOnboard,
          ErrorMessage: [],
          OutputResult: {
            Status: true,
            Messages: ''
          }
        }
      );
    }

    if (!isOnboard) {
      feedback.push(
        {
          UUID: entity.entityId,
          Entity: entity.entityName,
          HasSuccess: isOnboard,
          ErrorMessage: processErrors(entity.responses),
          OutputResult: {
            Status: true,
            Messages: ''
          }
        }
      )
    }
  });
  
  return feedback;
}

const processFeedback = (
  responses: BackendResponse[]
) => {
  const isOnboard = [];
  for (const response of responses) {
    isOnboard.push((response.success || typeof response.errors.entityAlreadyExists === 'object'));
  }

  return !isOnboard.includes(false);
}

const processErrors = (
  responses: BackendResponse[]
) => {
  const errorMessages = [];
  for (const response of responses) {
    if (!response.success) {
      errorMessages.push(...mapErrors(response.errors))
      messages = [];
    }
  }
  return errorMessages;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapErrors = (errors: any)  => {
  if (!messages) messages = [];

  if (errors instanceof Object) {
    const objectKeys = Object.keys(errors);
    
    if (objectKeys.includes(messageKey)) {
      messages = [...messages, ...errors[messageKey]];
    } else {
      for (const key in errors) {
        if (errors[key] instanceof Object) mapErrors(errors[key]);
      }
    }
  }
  
  return messages;
}