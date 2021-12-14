export interface HttpOptions {
  hostname: string;
  path: string;
  method: string;
  headers: {
    'Authorization': string,
    'Content-Type': string
  }
}
