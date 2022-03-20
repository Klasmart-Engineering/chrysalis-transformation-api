import { FeedbackResponse } from "../interfaces/clientSchemas";

export class HttpError {
  status: number;
  body: object;

  constructor(status: number, body: object = {}) {
    this.status = status;
    this.body = { ...body, code: status };
  }
}

export class AlreadyProcessedResponse {
  static entityName = 'Entities';

  private message: string;
  private alreadyProcessed: Record<string, string>[];
  private feedback: FeedbackResponse[]

  constructor(
    message = '',
    alreadyProcessed: Record<string, string>[] = [],
    feedback: FeedbackResponse[] = []
  ) {
    this.message = message
    this.alreadyProcessed = alreadyProcessed;
    this.feedback = feedback;
  }

  set _message(message: string) {
    this.message = message;
  }

  set _alreadyProcessed(alreadyProcessed: Record<string, string>[]) {
    this.alreadyProcessed = alreadyProcessed 
  }

  set _feedback(feedback: FeedbackResponse[]) {
    this.feedback = feedback;
  }

  get instance() {
    return new AlreadyProcessedResponse(AlreadyProcessedResponse.entityName, this.alreadyProcessed, this.feedback);
  }
}
