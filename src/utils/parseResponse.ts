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
  return { statusCode, response }
}