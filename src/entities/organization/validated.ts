import { validate, ClientUuid, Uuid } from '../../utils';
import { Prisma } from '@prisma/client';
import { Entity } from '..';
import { AdminService } from '../../api/adminService';
import { Category, logError, ValidationError } from '../../utils/errors';
import { IOrganization, Organization } from '.';

export class ValidatedOrganization {
  private data: IOrganization;

  private constructor(
    org: IOrganization,
    private klUuid: Uuid,
    private klShortCode: string
  ) {
    this.data = org;
  }

  get name(): string {
    return this.data.OrganizationName;
  }

  get clientUuid(): ClientUuid {
    return this.data.OrganizationUUID;
  }

  get kidsloopUuid(): Uuid {
    return this.klUuid;
  }

  get kidsloopShortCode(): Uuid {
    return this.kidsloopShortCode;
  }

  /**
   * Note: Because an Organization should already exist in the KidsLoop
   * User Service prior to the onboarding occurring, this function validates
   * that it has correctly been added.
   *
   * This is currently the only entity where this behaviour occurs.
   *
   * @param {IOrganization} org - The organization data to be validated
   * @returns {ValidatedOrganization} A validated organization
   * @throws If the organization is invalid
   */
  public static async validate(
    v: Organization
  ): Promise<ValidatedOrganization> {
    const data = await validate<
      IOrganization,
      Organization,
      ValidatedOrganization
    >(v);
    try {
      const userService = await AdminService.getInstance();
      const { klUuid, klShortCode } = await userService.getOrganization(
        data.OrganizationName
      );
      return new ValidatedOrganization(data, klUuid, klShortCode);
    } catch (error) {
      throw logError(
        new ValidationError(Entity.ORGANIZATION, v.data.OrganizationUUID, [
          {
            path: `${v.data.OrganizationUUID}`,
            details: `Unable to find Organization: ${v.data.OrganizationName} in the system`,
          },
        ]),
        Entity.ORGANIZATION,
        v.getEntityId(),
        Category.C1_API
      );
    }
  }

  /**
   * Maps the data held internally into a format required for a database
   * create object
   */
  public async mapToDatabaseInput(): Promise<Prisma.OrganizationCreateInput> {
    return {
      clientUuid: this.clientUuid,
      name: this.name,
      klUuid: this.kidsloopUuid,
      klShortCode: this.klShortCode,
    };
  }
}
