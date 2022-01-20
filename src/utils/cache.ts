import LRU from "lru-cache";
export class Cache {
  private static _instance: Cache;

  private organizations = new LRU<string, string>({
    max: 0,
    maxAge: 24 * 60 * 60 * 1000,
    updateAgeOnGet: true,
  });

  private schools = new LRU<string, string>({
    max: 50,
    maxAge: 60 * 1000,
    updateAgeOnGet: true,
  });

  private classes = new LRU<string, string>({
    max: 50,
    maxAge: 60 * 1000,
    updateAgeOnGet: true,
  });

  private users = new LRU<string, string>({
    max: 100,
    maxAge: 60 * 1000,
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

  public getOrganizationId(
    name: string
  ): string | null {
    const value = this.organizations.get(name);
    if (value) return value;
    return null;
  }

  public addOrganizationId(
    name: string,
    id: string,
  ): void {
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
  //
  // public addSchoolId(
  //   name: string,
  //   id: string
  // ): void {
  //   this.schools.set(name, id);
  // }
  //
  // public async getClassId(
  //   name: string
  // ): Promise<string> {
  //   const value = this.classes.get(name);
  //   if (value) return value;
  //   // - FETCH ID FROM C1 API
  //   // - ADD VALUE INTO CACHE
  //   // - RETURN VALUE
  // }
  //
  // public addClassId(
  //   name: string,
  //   id: string
  // ): void {
  //   this.classes.set(name, id);
  // }
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