export class HttpError {
  status: number;
  body: object;

  constructor(status: number, res: object) {
    this.status = status;
    this.body = res;
  }
}
