import { PrismaClient } from '@prisma/client';

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

  public isValid(name: string): boolean {
    return this.data.has(name);
  }

  public idForProgram(name: string): ClientUuid {
    const id = this.data.get(name);
    if (!id) throw new Error('Invalid program name');
    return id;
  }
}

