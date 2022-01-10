import LRU from 'lru-cache';
import { Entity } from '../';
import { ClientUuid, Uuid, log } from '../../utils';
import {
  ProgramName,
  OrganizationId,
  Program,
  SchoolId,
  ClassId,
  ProgramRepo,
} from '.';

export class ProgramHashMap {
  private map = new Map<ProgramName, Map<OrganizationId, Program>>();

  // This is used to make sure we don't keep sending requests to the database
  // more often than is needed
  private haveChecked = new LRU({ maxAge: 1000 * 60, max: 50 });

  /**
   * @param {string} name - The program name
   * @param {Uuid} id - The KidsLoop UUID for the program - as registered in the
   * User service
   * @param {string} organisationName - The name of the organisation this role
   * belongs to
   */
  private insertProgram(program: Program): void {
    const map = this.map.get(program.name) || new Map();
    map.set(program.clientOrgUuid, program);
    this.map.set(program.name, map);
  }

  private getProgram(name: ProgramName): Map<OrganizationId, Program> {
    const program = this.map.get(name);
    if (!program) throw new Error(`Program ${name} does not exist`);
    return program;
  }

  public async getProgramId(
    name: ProgramName,
    org: OrganizationId
  ): Promise<Uuid> {
    const program = await this.getProgramForOrg(name, org);
    return program.id;
  }

  public async getProgramForOrg(
    name: ProgramName,
    org: OrganizationId
  ): Promise<Program> {
    const p = this.getProgram(name).get(org);
    if (p) return p;
    try {
      const program = await this.fetchProgramFromStorage(name, org);
      return program;
    } catch (error) {
      log.warn(`Failed to find Program ${name} for Organization: ${org}`, {
        error,
        details: 'Checked both cache and database and found no valid entry',
        entity: Entity.PROGRAM,
      });
      throw new Error(
        `Organization ${org} does not have an entry for program ${name}`
      );
    }
  }

  public async programIsInOrganization(
    name: ProgramName,
    org: OrganizationId
  ): Promise<boolean> {
    try {
      await this.getProgramForOrg(name, org);
      return true;
    } catch (_) {
      return false;
    }
  }

  public async programIsInSchool(
    name: ProgramName,
    org: OrganizationId,
    school: SchoolId
  ): Promise<boolean> {
    try {
      const p = await this.getProgramForOrg(name, org);
      return p.valid(school);
    } catch (_) {
      return false;
    }
  }

  public async programIsInClass(
    name: ProgramName,
    org: OrganizationId,
    classId: ClassId,
    school?: SchoolId
  ): Promise<boolean> {
    try {
      const p = await this.getProgramForOrg(name, org);
      return p.valid(school, classId);
    } catch (_) {
      return false;
    }
  }

  private async fetchProgramFromStorage(
    name: ProgramName,
    orgId: ClientUuid
  ): Promise<Program> {
    const key = this.generateHaveCheckedKey(name, orgId);
    if (this.haveChecked.has(key))
      throw Error(
        'Have checked storage recently for the organization and it was not found'
      );
    const program = await ProgramRepo.findProgramByNameForOrganization(
      name,
      orgId
    );
    this.insertProgram(program);
    this.haveChecked.set(key, null);
    return program;
  }

  private generateHaveCheckedKey(name: ProgramName, orgId: ClientUuid): string {
    return `${name}::${orgId}`;
  }
}
