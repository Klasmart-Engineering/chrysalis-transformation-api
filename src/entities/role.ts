import { PrismaClient, Role } from '@prisma/client';
import { Entity } from '.';
import { InvalidEntityNameError } from '../utils/errors';

import log from '../utils/logging';

const prisma = new PrismaClient();

export class Roles {
  private static _instance: Roles;

  private constructor(private data: Map<string, Role>) {}

  public static async initialize(): Promise<Roles> {
    if (this._instance) return this._instance;
    try {
      const roles = await prisma.role.findMany();
      const data = new Map();
      for (const role of roles) {
        data.set(role.name, role);
      }
      this._instance = new Roles(data);
      return this._instance;
    } catch (error) {
      log.error('Failed to fetch roles from database', { error });
      throw new Error('Failed to initialize roles');
    }
  }

  public isValid(name: string): boolean {
    const role = this.data.has(name);
    return role;
  }

  /**
   * @param {string} - The name of the program
   * @returns {string} - The associated ID for that program name. _Note. This is
   * the database table ID, not the Client UUID OR the KidsLoop UUID._
   * @errors If the role name is not found
   */
  public idForRole(name: string): string {
    const role = this.data.get(name);
    if (!role) throw new InvalidEntityNameError(Entity.ROLE, name);
    return role.klUuid;
  }
}

