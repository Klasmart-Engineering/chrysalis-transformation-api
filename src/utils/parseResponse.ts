import { BackendResponse, BackendResponses } from '../interfaces/backendResponse';
import { log, protobufToEntity } from '@kl-engineering/cil-lib';
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