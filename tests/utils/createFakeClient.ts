import { HttpOptions } from '../../src/interfaces/httpOptions';

export function createFakeClient(hostname: string, path: string): HttpOptions {
  return {
    hostname: hostname,
    path: path,
    method: 'GET',
    headers: {
      Authorization: 'Bearer ',
      'Content-Type': 'application/json',
    },
  };
}
