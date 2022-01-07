import log from '../utils/logging';
import { PrismaClient, Organization as Org } from '@prisma/client';
import { organizationSchema } from '../validatorsSchemes';

const prisma = new PrismaClient();

export interface IOrganization {
  OrganizationName: string;
  OrganizationUUID: string;
}

export class Organization {
  // @TODO
  //

  public static async findOneByName(name: string): Promise<Org> {
    try {
      const org = await prisma.organization.findFirst({
        where: {
          name,
        },
      });
      if (!org) throw new Error(`School ${name} was not found`);
      return org;
    } catch (error) {
      log.error('Failed to find school in database', {
        error,
        name,
      });
      throw error;
    }
  }
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
