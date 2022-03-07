import { Entity } from "../utils/parseResponse";


export interface BackendResponses {
  responsesList: BackendResponse[];
}

export interface BackendResponse {
  requestId: {
    id: string;
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
