import { Entity } from 'cil-lib';

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

enum ErrorKeys {
  'validation',
  'request',
  'internalServer',
  'entityAlreadyExists',
  'entityDoesNotExist',
}

