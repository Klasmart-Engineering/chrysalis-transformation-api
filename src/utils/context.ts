import LRU from 'lru-cache';
import { Programs } from '../entities/program';
import { Roles } from '../entities/role';
import { SchoolRepo } from '../entities/school';
import { OrganizationRepo } from '../entities/organization';
import log from '../utils/logging';
import { ClassRepo } from '../entities/class';
import { InvalidEntityNameError } from './errors';
import { Entity } from '../entities';
import { ClientUuid, Uuid } from '.';

export class Context {
  private static _instance: Context;

  private schools = new LRU<string, ClientUuid>({
    max: 50,
    updateAgeOnGet: true,
  });

  private organizations = new LRU<string, ClientUuid>({
    max: 50,
    updateAgeOnGet: true,
  });

  private classes = new LRU<string, ClientUuid>({
    max: 50,
    updateAgeOnGet: true,
  });

  private constructor(public roles: Roles, public programs: Programs) {}

  public static async getInstance(): Promise<Context> {
    if (this._instance) return this._instance;
    try {
      const roles = await Roles.initialize();
      const programs = await Programs.initialize();
      this._instance = new Context(roles, programs);
      return this._instance;
    } catch (error) {
      log.error('Failed to initialize Context', {
        error,
      });
      throw error;
    }
  }

  /**
   * @param {string} name - The name of the role
   * @returns {boolean} `true` if the role is valid
   * @errors If the role is invalid
   */
  public roleIsValid(name: string): boolean {
    return this.roles.isValid(name);
  }

  /**
   * @param {string[]} roles - The role names to be validated
   * @errors If any of the roles are invalid
   */
  public rolesAreValid(roles: string[]): void {
    const results = roles
      .map((r) => ({ name: r, valid: this.roleIsValid(r) }))
      .filter((r) => !r.valid)
      .map(({ name }) => new InvalidEntityNameError(Entity.ROLE, name));
    if (results.length > 0) throw results;
  }

  /**
   * @param {string} name - The name of the program
   * @returns The ID for the program. _Note: this is the Database UUID, not the
   * KidsLoop UUID_
   * @errors If the program name is not found
   */
  public getProgramIdByName(name: string): Uuid {
    return this.programs.idForProgram(name);
  }

  public programIsValid(name: string): boolean {
    return this.programs.isValid(name);
  }

  /**
   * @param {string[]} programs - The program names to be validated
   * @errors If any of the programs are invalid
   */
  public programsAreValid(programs: string[]): void {
    const results = programs
      .map((p) => ({ name: p, valid: this.programIsValid(p) }))
      .filter((p) => !p.valid)
      .map(({ name }) => new InvalidEntityNameError(Entity.PROGRAM, name));
    if (results.length > 0) throw results;
  }

  /**
   * @param {string} name - The name of the organization
   * @returns {string} Client UUID for the organization
   * @errors if the name provided has no associated organization
   */
  public async getOrganizationClientId(name: string): Promise<ClientUuid> {
    const orgId = this.organizations.get(name);
    if (orgId) return orgId;
    const org = await OrganizationRepo.findByOrganizationName(name);
    if (org) {
      this.organizations.set(name, org.clientUuid);
      return org.clientUuid;
    }
    throw new InvalidEntityNameError(Entity.ORGANIZATION, name);
  }

  /**
   * @param {string} name - The name of the school
   * @returns {string} Client UUID for the school
   * @errors if the name provided has no associated school
   */
  public async getSchoolClientId(
    orgId: ClientUuid,
    schoolName: string
  ): Promise<ClientUuid> {
    const id = this.schools.get(schoolName);
    if (id) return id;
    const schoolId = await SchoolRepo.findSchoolClientIdBySchoolName(
      orgId,
      schoolName
    );
    if (schoolId) {
      this.schools.set(schoolName, schoolId);
      return schoolId;
    }
    throw new InvalidEntityNameError(Entity.SCHOOL, schoolName, {
      organizationId: orgId,
    });
  }

  /**
   * @param {string} name - The name of the class
   * @returns {string} Client UUID for the class
   * @errors if the name provided has no associated class
   */
  public async getClassClientId(
    orgId: ClientUuid,
    schoolId: ClientUuid,
    className: string
  ): Promise<ClientUuid> {
    const id = this.classes.get(className);
    if (id) return id;
    const classId = await ClassRepo.findClassClientIdByClassName(
      orgId,
      schoolId,
      className
    );
    if (classId) {
      this.classes.set(className, classId);
      return classId;
    }
    throw new InvalidEntityNameError(Entity.CLASS, className, {
      organizationId: orgId,
      schoolId,
    });
  }

  /**
   * @param {string[]} classNames - The class names to be validated
   * @param {ClientUuid} orgId - The organization id for the classes in question
   * @param {ClientUuid} schoolId - The school id for the classes in question
   * @errors If any of the classes are invalid
   */
  public async classesAreValid(
    classNames: string[],
    orgId: ClientUuid,
    schoolId: ClientUuid
  ): Promise<void> {
    const results = [];
    for (const name of classNames) {
      try {
        await this.getClassClientId(orgId, schoolId, name);
      } catch (e) {
        results.push(e);
      }
    }
    if (results.length > 0) throw results;
  }
}
