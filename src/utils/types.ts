export type CreateSchoolInput = {
  name: string;
  shortCode?: string;
  organizationId: string;
};

export type CreateSchoolsResponse = {
  school_name: string;
  shortcode: string;
};

export type RetriableTypes = 'client_error' | 'redis_error' | 'backend_error';

export type RetriableResponseType = {
  msg: string;
  type: RetriableTypes;
  endpoint: string;
  params: object;
};

export type FailedEntityTypes =
  | 'organization'
  | 'school'
  | 'class'
  | 'user'
  | 'linkEntities';

export type FailedResponseType = {
  msg: string;
  value: string;
  param: string;
  entity: FailedEntityTypes;
  uuid: string;
};

export type ErrorValidationType = {
  errors: FailedResponseType[];
};
