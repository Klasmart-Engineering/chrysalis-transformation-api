export * from './processChain';

export { HttpClient } from './httpClient';
export { Context } from './context';
export { log } from './log';
export { Category, logError } from './errors';

export type ClientUuid = string;
export type Uuid = string;

export type ProgramName = string;
export type RoleName = string;

// Client UUIDs
export type OrganizationId = ClientUuid;
export type SchoolId = ClientUuid;
export type ClassId = ClientUuid;

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
