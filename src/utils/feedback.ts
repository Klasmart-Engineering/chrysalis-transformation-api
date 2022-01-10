export type Feedback = {
  UUID: string;
  Entity: string;
  HasSuccess: boolean;
  ErrorMessage?: string;
};

export interface ToFeedback {
  toFeedback(e?: unknown): Feedback;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function instanceOfToFeedback(object: any): object is ToFeedback {
  return 'toFeedback' in object;
}
