import { Entity } from '..';
import { AdminService } from '../../api/adminService';
import { ClientUuid, Uuid, log } from '../../utils';
import { Category, logError, ValidationError } from '../../utils/errors';
import { RoleName, RoleRepo } from '.';
import { RoleHashMap } from './hashMap';

type OrganizationId = string;

/**
 * NOTE:
 * This assumes that the custom roles have been already added to the role
 * Table. This should be done at the point in time that each Organization is
 * added to the Organization Table
 */

export class Roles {
  private static _instance: Roles;

  private constructor(
    private systemRoles: Map<RoleName, Uuid>,
    private customRoles: RoleHashMap
  ) {}

  public static async initialize(): Promise<Roles> {
    if (this._instance) return this._instance;
    try {
      const adminService = await AdminService.getInstance();
      const systemRoles = await adminService.getSystemRoles();

      const system = new Map();
      for (const role of systemRoles) {
        system.set(role.name, role.kidsloopUuid);
      }
      this._instance = new Roles(system, new RoleHashMap());
      return this._instance;
    } catch (error) {
      throw logError(error, Entity.ROLE, 'NOT VALID', Category.ADMIN_SERVICE, {
        msg: 'Failed to initialize roles',
      });
    }
  }

  /**
   * Clears the cache of all stored roles
   * this is mainly something to do periodly to ensure
   * that memory usage doesn't end up to large
   */
  public flush(): void {
    this.customRoles = new RoleHashMap();
  }

  /**
   * Fetch all organization roles from the Admin Service and store them in
   * CIL DB.
   *
   * @param {ClientUuid} orgId - The KidsLoop UUID for the organization you want
   * to fetch the roles for
   * @throws if either the network call or the database calls fail
   */
  public async fetchAndStoreRolesForOrg(orgId: ClientUuid): Promise<void> {
    const adminService = await AdminService.getInstance();
    const roles = await adminService.getOrganizationRoles(orgId);
    const errors = [];
    for (const r of roles) {
      try {
        await RoleRepo.insertOne(r);
      } catch (e) {
        errors.push(e);
      }
    }
    if (errors.length > 0) throw errors;
  }

  /**
   * Checks that the name of the role is valid given the provided arguments.
   *
   * @param {string} name - The name of the role
   * @param {string} orgId - The client UUID of the organization
   * @returns {Uuid} - Returns KidsLoop UUID if the role is valid
   * @throws If the role name is invalid for the given organization
   */
  public async getIdForRole(
    name: RoleName,
    orgId: OrganizationId
  ): Promise<Uuid> {
    try {
      const role = await this.customRoles.getRoleForOrg(name, orgId);
      return role.kidsloopUuid;
    } catch (_) {
      log.debug('Found no custom roles, attempting to look at system roles', {
        name,
        orgId,
        entity: Entity.ROLE,
      });
    }
    const id = this.systemRoles.get(name);
    if (id) return id;
    const error = new ValidationError(Entity.ROLE, name, [
      {
        path: orgId,
        details: `No valid entry was found for role name: ${name} for organization ID ${orgId}.
          Roles follow a heirarchy: Organization -> User.
          In-order for a role to be valid for a user, it MUST exist in their parent organization`,
      },
    ]);
    throw logError(error, Entity.ROLE, 'UNKNOWN', Category.APP, {
      props: {
        programName: name,
        orgId,
      },
    });
  }

  /**
   * Checks that the name of the role is valid given the provided arguments.
   *
   * @param {string} name - The name of the role
   * @param {string} orgId - The client UUID of the organization
   * @returns {boolean} - Returns `true` is the role name is valid for the
   * given organization
   */
  public async roleIsValid(
    name: RoleName,
    orgId: OrganizationId
  ): Promise<boolean> {
    try {
      await this.getIdForRole(name, orgId);
      return true;
    } catch (_) {
      return false;
    }
  }
}
