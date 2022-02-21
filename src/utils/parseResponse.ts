import { BackendResponse, BackendResponses } from '../interfaces/backendResponse';
import { log, protobufToEntity } from 'cil-lib';
import { BackendService } from '../services/backendService';

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
  const mappedResponses = generateFeedback(response);
  return { statusCode, response, mappedResponses}
}

function generateFeedback(responses: BackendResponses) {
  const mappedRespponses: Array<{entityId: string, responses: BackendResponse[]}> = [];
  responses.responsesList.forEach(el => {
    const entityExists = mappedRespponses.find(item => item.entityId === el.entityId)
    if (entityExists) {
      entityExists.responses.push(el);
    } else {
      mappedRespponses.push({ entityId: el.entityId, responses: [el]})
    }
  });

  const feedback: Feedback[] = [];
  mappedRespponses.forEach(entity => {
    entity.responses.forEach(response => {
      const entityExists = feedback.find(item => item.UUID === entity.entityId);
      if (response.success || 'entityAlreadyExists' in response.errors) {
        if (!entityExists) feedback.push(
          {
            UUID: response.entityId,
            Entity: response.entityName,
            HasSuccess: response.success,
            ErrorMessage: mapErrors(response.errors),
            OutputResult: {
              Status: true,
              Messages: ''
            }
          }
        )
      } else {
        if (!entityExists) {
          feedback.push({
              UUID: response.entityId,
              Entity: response.entityName,
              HasSuccess: true,
              ErrorMessage: [],
              OutputResult: {
                Status: true,
                Messages: ''
              }
            }
          )
        } else {
          //TODO push to existing
        }
      }
    })
  })
  return mappedRespponses;
}

interface Feedback {
  UUID: string;
  Entity: string;
  HasSuccess: boolean;
  ErrorMessage: string[];
  OutputResult: OutputResult;
}

interface OutputResult {
  Status: boolean;
  Messages: string;
}

function mapErrors(errors: object) {
  return [];
}