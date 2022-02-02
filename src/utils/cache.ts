import LRU from 'lru-cache';
import { C1Service } from '../services/c1Service';
import { OrganizationQuerySchema } from '../interfaces/clientSchemas';
import { MAX, MAX_AGE } from '../config/cache';
const service = new C1Service();

export class Cache {
  private static _instance: Cache;

  private organizations = new LRU<string, string>({
    max: MAX,
    maxAge: MAX_AGE,
    updateAgeOnGet: true,
  });

  private schools = new LRU<string, string>({
    max: MAX,
    maxAge: MAX_AGE,
    updateAgeOnGet: true,
  });

  private classes = new LRU<string, string>({
    max: MAX,
    maxAge: MAX_AGE,
    updateAgeOnGet: true,
  });

  private users = new LRU<string, string>({
    max: MAX,
    maxAge: MAX_AGE,
    updateAgeOnGet: true,
  });

  private constructor() {
    // Handled in Context.getInstance();
  }

  public static getInstance(): Cache {
    if (this._instance) return this._instance;
    this._instance = new Cache();
    return this._instance;
  }

  public async getOrganizationId(
    name: string
  ): Promise<string> {
    const value = this.organizations.get(name);
    if (value) return value;
    const organizations = await service.getOrganizations();
    let uuid = '';
    organizations.forEach((org: OrganizationQuerySchema) => {
      this.addOrganizationId(org.OrganizationName, org.OrganizationUUID)
      if (name === org.OrganizationName) uuid = org.OrganizationUUID;
    });
    return uuid;
  }

  public addOrganizationId(name: string, id: string): void {
    this.organizations.set(name, id);
  }
  // public async getSchoolId(
  //   name: string
  // ): Promise<string> {
  //   const value = this.schools.get(name);
  //   if (value) return value;
  //   // - FETCH ID FROM C1 API
  //   // - ADD VALUE INTO CACHE
  //   // - RETURN VALUE
  // }

  public addSchoolId(
    name: string,
    id: string
  ): void {
    this.schools.set(name, id);
  }

  public getClassId(name: string): string | null {
    const value = this.classes.get(name);
    if (value) return value;
    return null;
  }

  public addClassId(name: string, id: string): void {
    this.classes.set(name, id);
  }
  //
  // public async getUserId(
  //   name: string
  // ): Promise<string> {
  //   const value = this.users.get(name);
  //   if (value) return value;
  //   // - FETCH ID FROM C1 API
  //   // - ADD VALUE INTO CACHE
  //   // - RETURN VALUE
  // }
  //
  // public addUserId(
  //   name: string,
  //   id: string
  // ): void {
  //   this.users.set(name, id);
  // }
}
