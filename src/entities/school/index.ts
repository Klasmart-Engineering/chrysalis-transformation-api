import { ClientUuid, ProcessChain } from '../../utils';
import { schoolSchema } from '../../validatorsSchemes';
import { Entity } from '..';
import { Api } from '../../api/c1Api';
import { SchoolRepo } from './repo';
import { ValidatedSchool } from './validated';

export { SchoolRepo } from './repo';
export { ValidatedSchool } from './validated';

export interface ISchool {
  OrganizationName: string;
  SchoolUUID: string;
  SchoolName: string;
  SchoolShortCode: string;
  ProgramName: string[];
  Source: string;
}

export class School implements ProcessChain<ISchool, ValidatedSchool> {
  public readonly schema = schoolSchema;
  public readonly entity = Entity.SCHOOL;

  private constructor(public readonly data: ISchool) {}

  public getEntityId(): string {
    return this.data.SchoolUUID;
  }

  public async validate(): Promise<ValidatedSchool> {
    return await ValidatedSchool.validate(this);
  }

  public async insertOne(item: ValidatedSchool): Promise<void> {
    await SchoolRepo.insertOne(item);
  }

  public async process(): Promise<ValidatedSchool> {
    const school = await this.validate();
    await this.insertOne(school);
    return school;
  }

  public getOrganizationName(): string {
    return this.data.OrganizationName;
  }

  public getPrograms(): string[] {
    return this.data.ProgramName;
  }

  public static async fetchAllForOrganization(
    orgId: ClientUuid
  ): Promise<School[]> {
    const api = await Api.getInstance();
    const schools = await api.getSchoolsByOrganizationId(orgId);
    return schools.map((s) => new School(s));
  }

  public static async fetch(id: ClientUuid): Promise<School> {
    const api = await Api.getInstance();
    const school = await api.getSchool(id);
    return new School(school);
  }
}
