export type Feedback = {
    UUID: string;
    Entity: string;
    HasSuccess: boolean;
    ErrorMessage?: string; 
};

export interface ToFeedback {
    toFeedback(): Feedback
}