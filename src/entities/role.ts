import { Prisma, PrismaClient } from '@prisma/client';
import { Entity } from '.';
import { UserService } from '../api/userService';
import { ClientUuid, Uuid, log } from '../utils';
import { ValidationError } from '../utils/errors';

type RoleName = string;

// All of these are CLIENT UUIDs
type OrganizationId = ClientUuid;

export class Role {
  constructor(
    public readonly name: string,
    public readonly kidsloopUuid: Uuid,
    public readonly isKidsLoopRole: boolean = false,
    public readonly organisationClientId?: ClientUuid
  ) {
    if (!isKidsLoopRole && !organisationClientId)
      throw new Error(
        'Invalid Data. If the role is not a default KidsLoop role, a client Organization ID must be provided'
      );
  }

  public async mapToDatabaseInput(): Promise<Prisma.RoleCreateInput> {
    const role: Prisma.RoleCreateInput = {
      klUuid: this.kidsloopUuid,
      name: this.name,
    };
    if (!this.isKidsLoopRole) {
      role.organization = {
        connect: { clientUuid: this.organisationClientId },
      };
    }
    return role;
  }
}

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
      const userService = await UserService.getInstance();
      const systemRoles = await userService.getSystemRoles();

      const system = new Map();
      for (const role of systemRoles) {
        system.set(role.name, role.kidsloopUuid);
      }
      this._instance = new Roles(system, new RoleHashMap());
      return this._instance;
    } catch (error) {
      log.error('Failed to initialize roles', {
        error,
        entity: Entity.ROLE,
      });
      throw new Error('Failed to initialize roles');
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
    log.error(`Invalid role name: ${name}`, {
      error: 'Invalid role name',
      name,
      orgId,
      entity: Entity.ROLE,
    });
    throw new ValidationError(Entity.ROLE, name, [
      {
        path: orgId,
        details: `No valid entry was found for role name: ${name} for organization ID ${orgId}.
          Roles follow a heirarchy: Organization -> User.
          In-order for a role to be valid for a user, it MUST exist in their parent organization`,
      },
    ]);
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

class RoleHashMap {
  private map = new Map<RoleName, Map<OrganizationId, Role>>();

  // This is used to make sure we don't keep sending requests to the database
  // more often than is needed
  private haveChecked = new Set<string>();

  private insertRole(role: Role): void {
    const map = this.map.get(role.name) || new Map();
    map.set(role.organisationClientId, role);
    this.map.set(role.name, map);
  }

  private getRole(name: RoleName): Map<OrganizationId, Role> {
    const role = this.map.get(name);
    if (!role) throw new Error(`Role ${name} does not exist`);
    return role;
  }

  public async getRoleId(name: RoleName, org: OrganizationId): Promise<Uuid> {
    const role = await this.getRoleForOrg(name, org);
    return role.kidsloopUuid;
  }

  public async getRoleForOrg(
    name: RoleName,
    org: OrganizationId
  ): Promise<Role> {
    const r = this.getRole(name).get(org);
    if (r) return r;
    try {
      const role = await this.fetchRoleFromStorage(name, org);
      return role;
    } catch (error) {
      log.warn(`Failed to find Role ${name} for Organization: ${org}`, {
        error,
        details: 'Checked both cache and database and found no valid entry',
        entity: Entity.ROLE,
      });
      throw new Error(
        `Organization ${org} does not have an entry for role ${name}`
      );
    }
  }

  public async roleIsInOrganization(
    name: RoleName,
    org: OrganizationId
  ): Promise<boolean> {
    try {
      await this.getRoleForOrg(name, org);
      return true;
    } catch (_) {
      return false;
    }
  }

  private async fetchRoleFromStorage(
    name: RoleName,
    orgId: ClientUuid
  ): Promise<Role> {
    const key = this.generateHaveCheckedKey(name, orgId);
    if (this.haveChecked.has(key))
      throw Error(`Invalid role ${name} for Organization ${orgId}`);
    const role = await RoleRepo.findRoleByNameForOrganization(name, orgId);
    this.insertRole(role);
    this.haveChecked.add(key);
    return role;
  }

  private generateHaveCheckedKey(name: RoleName, orgId: ClientUuid): string {
    return `${name}::${orgId}`;
  }
}

const prisma = new PrismaClient();

export class RoleRepo {
  public static async insertOne(role: Role): Promise<void> {
    try {
      await prisma.role.create({
        data: await role.mapToDatabaseInput(),
      });
    } catch (error) {
      log.error('Failed to insert role into database', {
        error,
        entity: Entity.ROLE,
        id: role.kidsloopUuid,
        name: role.name,
      });
    }
  }

  public static async findRoleByNameForOrganization(
    roleName: RoleName,
    org: OrganizationId
  ): Promise<Role> {
    try {
      const role = await prisma.role.findFirst({
        where: {
          name: roleName,
          clientOrgUuid: org,
        },
        select: {
          klUuid: true,
          name: true,
          clientOrgUuid: true,
        },
      });
      if (!role)
        throw new Error(`Role ${roleName} not found for Organization ${org}`);
      return new Role(role.klUuid, role.name, false, role.clientOrgUuid!);
    } catch (error) {
      log.error(
        'Failed to find role in database when searching with organisation id',
        {
          error,
          name: roleName,
          organisationId: org,
          entity: Entity.ROLE,
        }
      );
      throw error;
    }
  }

  public static async findManyByOrganizationId(
    org: OrganizationId
  ): Promise<Role[]> {
    try {
      const roles = await prisma.role.findMany({
        where: {
          clientOrgUuid: org,
        },
        select: {
          klUuid: true,
          name: true,
          clientOrgUuid: true,
        },
      });
      return roles.map(
        ({ klUuid, name, clientOrgUuid }) =>
          new Role(klUuid, name, false, clientOrgUuid!)
      );
    } catch (error) {
      log.error(
        'Failed to find roles in database when searching with organisation id',
        {
          error,
          organisationId: org,
          entity: Entity.ROLE,
        }
      );
      throw error;
    }
  }
}
