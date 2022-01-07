import { PrismaClient } from '@prisma/client';
import { Entity } from '.';
import { InvalidEntityNameError } from '../utils/errors';

import log from '../utils/logging';

const prisma = new PrismaClient();

type ClientUuid = string;

export class Programs {
  private static _instance: Programs;

  private constructor(private data: Map<string, ClientUuid>) {}

  public static async initialize(): Promise<Programs> {
    if (this._instance) return this._instance;
    try {
      const programs = await prisma.program.findMany();
      const data = new Map();
      for (const program of programs) {
        data.set(program.name, program.id);
      }
      this._instance = new Programs(data);
      return this._instance;
    } catch (error) {
      log.error('Failed to fetch programs from database', { error });
      throw new Error('Failed to initialize programs');
    }
  }

  /**
   * Checks that the name of the program is valid.
   *
   * @param {string} - The name of the program
   * @returns {boolean} - Returns `true` if the program name is valid
   */
  public isValid(name: string): boolean {
    return this.data.has(name);
  }

  /**
   * @param {string} - The name of the program
   * @returns {string} - The associated ID for that program name. _Note. This is
   * the database table ID, not the Client UUID OR the KidsLoop UUID._
   * @errors If the program name is not found
   */
  public idForProgram(name: string): ClientUuid {
    const id = this.data.get(name);
    if (!id) throw new InvalidEntityNameError(Entity.PROGRAM, name);
    return id;
  }
}

