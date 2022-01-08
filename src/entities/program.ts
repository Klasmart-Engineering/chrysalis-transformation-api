import { Prisma, PrismaClient } from '@prisma/client';
import LRU from 'lru-cache';
import { Entity } from '.';
import { UserService } from '../api/userService';
import { ClientUuid, Uuid, log } from '../utils';
import { ValidationError } from '../utils/errors';

type ProgramName = string;

// All of these are CLIENT UUIDs
type OrganizationId = ClientUuid;
type SchoolId = ClientUuid;
type ClassId = ClientUuid;

export class RawProgram {
  constructor(
    public readonly name: string,
    public readonly kidsloopUuid: Uuid,
    public readonly isKidsLoopProgram: boolean = false,
    public readonly organisationClientId?: ClientUuid
  ) {
    if (!isKidsLoopProgram && !organisationClientId)
      throw new Error(
        'Invalid Data. If the program is not a default KidsLoop Program, a client Organization ID must be provided'
      );
  }

  public async mapToDatabaseInput(): Promise<Prisma.ProgramCreateInput> {
    const program: Prisma.ProgramCreateInput = {
      klUuid: this.kidsloopUuid,
      name: this.name,
    };
    if (!this.isKidsLoopProgram) {
      program.organization = {
        connect: { clientUuid: this.organisationClientId },
      };
    }
    return program;
  }
}

export class Programs {
  private static _instance: Programs;

  private constructor(
    private systemPrograms: Map<ProgramName, Uuid>,
    private customPrograms: ProgramHashMap
  ) {}

  public static async initialize(): Promise<Programs> {
    if (this._instance) return this._instance;
    try {
      const userService = await UserService.getInstance();
      const systemPrograms = await userService.getSystemPrograms();

      const system = new Map();
      for (const program of systemPrograms) {
        system.set(program.name, program.kidsloopUuid);
      }
      this._instance = new Programs(system, new ProgramHashMap());
      return this._instance;
    } catch (error) {
      log.error('Failed to initialize programs', { error });
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

class ProgramHashMap {
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

const prisma = new PrismaClient();

export class ProgramRepo {
  public static async insertOne(program: RawProgram): Promise<void> {
    try {
      await prisma.program.create({
        data: await program.mapToDatabaseInput(),
      });
    } catch (error) {
      log.error('Failed to insert program into database', {
        error,
        id: program.kidsloopUuid,
        name: program.name,
      });
    }
  }

  public static async findProgramByNameForOrganization(
    programName: ProgramName,
    org: OrganizationId
  ): Promise<Program> {
    try {
      const program = await prisma.program.findFirst({
        where: {
          name: programName,
          clientOrgUuid: org,
        },
        select: {
          klUuid: true,
          name: true,
          clientOrgUuid: true,
          classes: {
            select: { clientUuid: true },
          },
          schools: {
            select: { clientUuid: true },
          },
        },
      });
      if (!program)
        throw new Error(
          `Program ${programName} not found for Organization ${org}`
        );
      return new Program(
        program.klUuid,
        program.name,
        program.clientOrgUuid!,
        program.classes.map((c) => c.clientUuid),
        program.schools.map((s) => s.clientUuid)
      );
    } catch (error) {
      let logLevel = 'error';
      if (
        error instanceof Error &&
        error.message.startsWith(`Program ${programName}`)
      ) {
        logLevel = 'warn';
      }
      log.log(
        logLevel,
        'Failed to find program in database when searching with organisation id',
        {
          error,
          programName,
          organisationId: org,
        }
      );
      throw error;
    }
  }

  public static async findManyByOrganizationId(
    org: OrganizationId
  ): Promise<Program[]> {
    try {
      const programs = await prisma.program.findMany({
        where: {
          clientOrgUuid: org,
        },
        select: {
          klUuid: true,
          name: true,
          clientOrgUuid: true,
          classes: {
            select: { clientUuid: true },
          },
          schools: {
            select: { clientUuid: true },
          },
        },
      });
      return programs.map(
        ({ klUuid, name, classes, clientOrgUuid, schools }) =>
          new Program(
            klUuid,
            name,
            clientOrgUuid!, // Okay to assert this always exists due to the query above
            classes.map((c) => c.clientUuid),
            schools.map((s) => s.clientUuid)
          )
      );
    } catch (error) {
      log.error(
        'Failed to find programs in database when searching with organisation id',
        {
          error,
          organisationId: org,
        }
      );
      throw error;
    }
  }
}

class Program {
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
