import { Entity } from '.';
import { AdminService } from '../api/adminService';
import { ClientUuid, Uuid, log } from '../utils';
import { InvalidEntityNameError } from '../utils/errors';

export class RawProgram {
  constructor(public name: string, public kidsloopUuid: Uuid) {}
}

export class Programs {
  private static _instance: Programs;

  private constructor(
    // @TODO can we drop this?
    private clientData: Map<string, ClientUuid>,
    private data: Map<string, RawProgram>
  ) {}

  public static async initialize(): Promise<Programs> {
    if (this._instance) return this._instance;
    try {
      const adminService = await AdminService.getInstance();
      const rawPrograms = await adminService.getPrograms();

      const data = new Map();
      for (const program of rawPrograms) {
        data.set(program.name, program);
      }
      this._instance = new Programs(new Map(), data);
      return this._instance;
    } catch (error) {
      log.error('Failed to initialize programs', { error });
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
   * @returns {Uuid} - The KidsLoop UUID for that program
   * @errors If the program name is not found
   */
  public idForProgram(name: string): Uuid {
    const id = this.data.get(name);
    if (!id) throw new InvalidEntityNameError(Entity.PROGRAM, name);
    return id.kidsloopUuid;
  }
}
