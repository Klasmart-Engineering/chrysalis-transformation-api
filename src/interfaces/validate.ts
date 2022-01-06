export interface Validate<T> {
    validate(entity: T): boolean;
}