import { ClientUuid, Uuid } from '../../utils';

export { Programs } from './programs';
export { RawProgram } from './rawProgram';
export { ProgramRepo } from './repo';

export type ProgramName = string;

// All of these are CLIENT UUIDs
export type OrganizationId = ClientUuid;
export type SchoolId = ClientUuid;
export type ClassId = ClientUuid;

export class Program {
  private readonly classes: Set<ClientUuid>;
  private readonly schools: Set<ClientUuid>;

  constructor(
    public readonly id: Uuid,
    public readonly name: ProgramName,
    public readonly clientOrgUuid: ClientUuid,
    classes: ClientUuid[],
    schools: ClientUuid[]
  ) {
    this.classes = new Set(classes);
    this.schools = new Set(schools);
  }

  /**
   * Checks that the role name is valid for the provided school or class IDs
   * @returns `true` if the role is valid for that school and/or class
   */
  public valid(schoolId?: ClientUuid, classId?: ClientUuid): boolean {
    if (schoolId) {
      if (!this.schools.has(schoolId)) return false;
    }
    if (classId) {
      if (!this.classes.has(classId)) return false;
    }
    return true;
  }
}
