export interface HttpOptions {
  hostname: string;
  path: string;
  method: string;
  headers: Record<string, string>;
  port: string | null;
}
