export class HttpError {
  status: number;
  body: object;

  constructor(status: number, body: object = {}) {
    this.status = status;
    this.body = { ...body, code: status };
  }
}
