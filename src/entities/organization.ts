import log from '../utils/logging';
import { organizationSchema } from '../validatorsSchemes';

export interface IOrganization {
  OrganizationName: string;
  OrganizationUUID: string;
}

export class ValidatedOrganization {
  public data: IOrganization;

  private constructor(org: IOrganization) {
    this.data = org;
  }

  public static validate(org: IOrganization): ValidatedOrganization {
    try {
      const { error, value } = organizationSchema.validate(org);
      if (error) throw error;
      return new ValidatedOrganization(value);
    } catch (error) {
      log.error(`Organization failed Validation`, {
        id: org.OrganizationUUID,
        error,
      });
      throw new Error('Validation failed');
    }
  }
}
