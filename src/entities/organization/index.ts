import { ClientUuid, ProcessChain } from '../../utils';
import { organizationSchema } from '../../validatorsSchemes';
import { Entity, Programs, Roles } from '..';
import { Api } from '../../api/c1Api';
import { OrganizationRepo } from './repo';
import { ValidatedOrganization } from './validated';

export { OrganizationRepo } from './repo';
export { ValidatedOrganization } from './validated';

export interface IOrganization {
  OrganizationName: string;
  OrganizationUUID: string;
}

export class Organization
  implements ProcessChain<IOrganization, ValidatedOrganization>
{
  public readonly schema = organizationSchema;
  public readonly entity = Entity.ORGANIZATION;

  private constructor(public readonly data: IOrganization) {}

  public getEntityId(): string {
    return this.data.OrganizationUUID;
  }

  public async validate(): Promise<ValidatedOrganization> {
    const org = await ValidatedOrganization.validate(this);
    return org;
  }

  public async insertOne(item: ValidatedOrganization): Promise<void> {
    await OrganizationRepo.insertOne(item);
  }

  public async process(): Promise<ValidatedOrganization> {
    const org = await this.validate();
    const kidsloopId = org.kidsloopUuid;
    await this.insertOne(org);
    const programs = await Programs.initialize();
    await programs.fetchAndStoreProgramsForOrg(kidsloopId);
    const roles = await Roles.initialize();
    await roles.fetchAndStoreRolesForOrg(kidsloopId);
    return org;
  }

  public getOrganizationName(): string {
    return this.data.OrganizationName;
  }

  public static async fetchAll(): Promise<Organization[]> {
    const api = await Api.getInstance();
    const orgs = await api.getAllOrganizations();
    return orgs.map((o) => new Organization(o));
  }

  public static async fetch(id: ClientUuid): Promise<Organization> {
    const api = await Api.getInstance();
    const org = await api.getOrganization(id);
    return new Organization(org);
  }
}
