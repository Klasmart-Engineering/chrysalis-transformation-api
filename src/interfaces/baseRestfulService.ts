import { HttpOptions } from './httpOptions';

export interface BaseRestfulService {
  hostname: string;
  schoolApiEndpoint: string;
  classApiEndpoint: string;
  studentApiEndpoint: string;
  staffApiEndpoint: string;

  createClient(path: string): HttpOptions;
  getSchools(params?: Record<string, unknown>): void;
  getClasses(): void;
  getStudents(): void;
  getStaff(): void;
}
