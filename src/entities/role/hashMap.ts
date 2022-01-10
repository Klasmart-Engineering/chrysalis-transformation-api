import { Entity } from '..';
import { ClientUuid, Uuid, log } from '../../utils';
import { RoleName, Role, RoleRepo } from '.';

type OrganizationId = string;

export class RoleHashMap {
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
