import { Entity } from '..';
import { AdminService } from '../../api/adminService';
import { ClientUuid, Uuid, log } from '../../utils';
import { logError, ValidationError } from '../../utils/errors';
import { ProgramName, OrganizationId, SchoolId, ClassId, ProgramRepo } from '.';
import { ProgramHashMap } from './hashMap';

/**
 * NOTE:
 * This assumes that the custom programs have been already added to the Program
 * Table. This should be done at the point in time that each Organization is
 * added to the Organization Table
 */

export class Programs {
  private static _instance: Programs;

  private constructor(
    private systemPrograms: Map<ProgramName, Uuid>,
    private customPrograms: ProgramHashMap
  ) {}

  public static async initialize(): Promise<Programs> {
    if (this._instance) return this._instance;
    try {
      const adminService = await AdminService.getInstance();
      const systemPrograms = await adminService.getSystemPrograms();

      const system = new Map();
      for (const program of systemPrograms) {
        system.set(program.name, program.kidsloopUuid);
      }
      this._instance = new Programs(system, new ProgramHashMap());
      return this._instance;
    } catch (error) {
      logError(error, Entity.PROGRAM, 'Failed to initialize programs');
      throw new Error('Failed to initialize programs');
    }
  }

  /**
   * Clears the cache of all stored programs
   * this is mainly something to do periodly to ensure
   * that memory usage doesn't end up to large
   */
  public flush(): void {
    this.customPrograms = new ProgramHashMap();
  }

  /**
   * Fetch all organization programs from the Admin Service and store them in
   * CIL DB.
   *
   * @param {ClientUuid} orgId - The KidsLoop UUID for the organization you want
   * to fetch the programs for
   * @throws if either the network call or the database calls fail
   */
  public async fetchAndStoreProgramsForOrg(orgId: ClientUuid): Promise<void> {
    const adminService = await AdminService.getInstance();
    const programs = await adminService.getOrganizationPrograms(orgId);
    const errors = [];
    for (const p of programs) {
      try {
        await ProgramRepo.insertOne(p);
      } catch (e) {
        errors.push(e);
      }
    }
    if (errors.length > 0) throw errors;
  }

  /**
   * Checks that the name of the program is valid given the provided arguments.
   *
   * @param {string} name - The name of the program
   * @param {string} orgId - The client UUID of the organization
   * @param {string?} schoolId - The client UUID of the school (optional)
   * @param {string?} classId - The client UUID of the class (optional)
   * @returns {Uuid} - Returns KidsLoop UUID if the program is valid
   * @throws If the program name is invalid for the given organization
   */
  public async getIdForProgram(
    name: ProgramName,
    orgId: OrganizationId,
    schoolId?: SchoolId,
    classId?: ClassId
  ): Promise<Uuid> {
    try {
      const program = await this.customPrograms.getProgramForOrg(name, orgId);
      if (!schoolId && !classId) return program.id;
      if (program.valid(schoolId, classId)) return program.id;
    } catch (_) {
      log.debug(
        'Found no custom programs, attempting to look at system programs',
        {
          programName: name,
          orgId,
          schoolId,
          classId,
          entity: Entity.PROGRAM,
        }
      );
    }
    const id = this.systemPrograms.get(name);
    if (id) return id;
    log.error(`Invalid program name: ${name}`, {
      error: 'Invalid program name',
      programName: name,
      orgId,
      schoolId,
      classId,
      entity: Entity.PROGRAM,
    });
    throw new ValidationError(Entity.PROGRAM, name, [
      {
        path: [orgId, schoolId, classId].filter((a) => !!a).join('.'),
        details: `No valid entry was found for program name: ${name}, with organization ID ${orgId}, schoolId: ${schoolId} and classId: ${classId}.
          Programs follow a heirarchy: Organization -> School -> Class.
          In-order for a program to be valid the entities parents MUST also contain that program name`,
      },
    ]);
  }

  /**
   * Checks that the name of the program is valid given the provided arguments.
   *
   * @param {string} name - The name of the program
   * @param {string} orgId - The client UUID of the organization
   * @param {string?} schoolId - The client UUID of the school (optional)
   * @param {string?} classId - The client UUID of the class (optional)
   * @returns {boolean} - Returns `true` is the program name is valid for the
   * given organization
   */
  public async programIsValid(
    name: ProgramName,
    orgId: OrganizationId,
    schoolId?: SchoolId,
    classId?: ClassId
  ): Promise<boolean> {
    try {
      await this.getIdForProgram(name, orgId, schoolId, classId);
      return true;
    } catch (_) {
      return false;
    }
  }
}
