import { Entity } from '..';
import { Api } from '../../api/c1Api';
import { ClientUuid, ProcessChain } from '../../utils';
import { classSchema } from '../../validatorsSchemes';
import { ClassRepo } from './repo';
import { ValidatedClass } from './validated';

export { ValidatedClass };
export { ClassRepo } from './repo';

export interface IClass {
  OrganizationName: string;
  ClassUUID: string;
  ClassName: string;
  ClassShortCode: string;
  ProgramName: string[];
  SchoolName: string;
}

export class Class implements ProcessChain<IClass, ValidatedClass> {
  public readonly schema = classSchema;
  public readonly entity = Entity.CLASS;

  private constructor(public readonly data: IClass) {}

  public getEntityId(): string {
    return this.data.ClassUUID;
  }

  public async validate(): Promise<ValidatedClass> {
    return await ValidatedClass.validate(this);
  }

  public async insertOne(item: ValidatedClass): Promise<void> {
    await ClassRepo.insertOne(item);
  }

  public async process(): Promise<ValidatedClass> {
    const c = await this.validate();
    await this.insertOne(c);
    return c;
  }

  public getOrganizationName(): string {
    return this.data.OrganizationName;
  }

  public getSchoolName(): string {
    return this.data.SchoolName;
  }

  public getPrograms(): string[] {
    return this.data.ProgramName;
  }

  public static async fetchAllForSchool(
    schoolId: ClientUuid
  ): Promise<Class[]> {
    const api = await Api.getInstance();
    const classes = await api.getClassesBySchool(schoolId);
    return classes.map((c) => new Class(c));
  }

  public static async fetch(id: ClientUuid): Promise<Class> {
    const api = await Api.getInstance();
    const c = await api.getClass(id);
    return new Class(c);
  }
}
