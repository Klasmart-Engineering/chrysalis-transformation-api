import LRU from 'lru-cache';
import { MAX, MAX_AGE } from '../config/cache';

export class Cache {
  private static _instance: Cache;

  private classes = new LRU<string, string>({
    max: MAX, // maximum size of the cache
    maxAge: MAX_AGE,
    updateAgeOnGet: false,
  });

  private constructor() {
    // Handled in Context.getInstance();
  }

  public static getInstance(): Cache {
    if (this._instance) return this._instance;
    this._instance = new Cache();
    return this._instance;
  }

  public getClassId(name: string): string | null {
    const value = this.classes.get(name);
    if (value) return value;
    return null;
  }

  public addClassId(name: string, id: string): void {
    this.classes.set(name, id);
  }
}
