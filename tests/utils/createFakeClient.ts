import { HttpOptions } from '../../src/interfaces/httpOptions';

export function createFakeClient(
  hostname: string,
  path: string,
  method?: string,
  contentLength?: number
): HttpOptions {
  let headers = {
    Authorization: 'Bearer ',
    'Content-Type': 'application/json',
  };
  if (contentLength) {
    headers = { ...headers, ...{ 'Content-Length': contentLength } };
  }

  return {
    hostname: hostname,
    path: path,
    method: method ? method : 'GET',
    headers: headers,
    port: '443',
  };
}
