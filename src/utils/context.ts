import LRU from 'lru-cache';
import { Programs } from '../entities/program';
import { Roles } from '../entities/role';
import { School } from '../entities/school';
import { Organization } from '../entities/organization';
import log from '../utils/logging';

export type ClientUuid = string;

export class Context {
  private static _instance: Context;

  private schoolNames = new LRU<string, ClientUuid>({
    max: 50,
    updateAgeOnGet: true,
  });

  private organizationNames = new LRU<string, ClientUuid>({
    max: 50,
    updateAgeOnGet: true,
  });

  private constructor(public roles: Roles, public programs: Programs) {}

  public static getInstance(roles?: Roles, programs?: Programs): Context {
    if (this._instance) return this._instance;
    if (!roles || !programs) {
      log.error(
        'Must provide both `Roles` and `Programs` in order to instantiate the context',
        {
          error: 'Instantiation error',
        }
      );
      throw new Error('Instantiated the Context incorrectly');
    }
    this._instance = new Context(roles, programs);
    return this._instance;
  }

  /**
   * @returns {string - Client UUID for the organization}
   * @errors { if the name provided has no associated organization }
   */
  public async organizationIsValid(name: string): Promise<ClientUuid> {
    const orgId = this.organizationNames.get(name);
    if (orgId) return orgId;
    const org = await Organization.findOneByName(name);
    if (org) {
      this.organizationNames.set(name, org.clientUuid);
      return org.clientUuid;
    }
    throw new Error('Organization is not found');
  }

  public roleIsValid(name: string): boolean {
    return this.roles.isValid(name);
  }

  public programNameIsValid(name: string): boolean {
    return this.programs.isValid(name);
  }

  public async schoolNameIsValid(name: string): Promise<boolean> {
    if (this.schoolNames.has(name)) return true;
    const schoolExists = await School.schoolNameExists(name);
    if (schoolExists) {
      this.schoolNames.set(name, null);
      return true;
    }
    return false;
  }
}
