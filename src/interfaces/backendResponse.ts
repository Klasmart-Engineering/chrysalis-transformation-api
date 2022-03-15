import { Entity } from "../utils/parseResponse";
import {requestIds} from "../config/requestIds";

export interface BackendResponses {
  responsesList: BackendResponse[];
}

export interface BackendResponse {
  requestId: {
    id: requestIds;
    n: string;
  };
  entity: number;
  entityName: Entity;
  entityId: string;
  success: boolean;
  errors: Record<ErrorKeys, object>;
}

type ErrorKeys = 
  'validation'          |
  'request'             | 
  'internalServer'      |   
  'entityAlreadyExists' | 
  'entityDoesNotExist';
