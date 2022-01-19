import { FailedResponseType, RetriableResponseType } from "./types";

export class HttpError {
  status: number;
  body: object;

  constructor(status: number, body: object = {}) {
    this.status = status;
    this.body = { ...body, code: status };
  }
}

export class SuccessResponse {
  retriable?: Array<RetriableResponseType>;
  failed?: Array<FailedResponseType>;

  constructor(retriable?: Array<RetriableResponseType>, failed?: Array<FailedResponseType>) {
    this.retriable = retriable;
    this.failed = failed;
  }
}
