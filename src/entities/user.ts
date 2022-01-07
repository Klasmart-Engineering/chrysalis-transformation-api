import log from '../utils/logging';
import { userSchema } from '../validatorsSchemes';
import { Prisma } from '@prisma/client';

export interface IUser {
  OrganizationName: string;
  UserUUID: string;
  UserGivenName: string;
  UserFamilyName: string;
  Email: string;
  Phone: string;
  DateOfBirth: string;
  Gender: string;
  KLRoleName: string[];
  SchoolName: string;
  ClassName: string[];
  SchoolRoleName: string[];
}

export class ValidatedUser {
  public data: IUser;

  private constructor(user: IUser) {
    this.data = user;
  }

  public static validate(user: IUser): ValidatedUser {
    try {
      const { error, value } = userSchema.validate(user);
      if (error) throw error;
      return new ValidatedUser(value);
    } catch (error) {
      log.error(`School failed Validation`, {
        id: user.UserUUID,
        error,
      });
      throw new Error('Validation failed');
    }
  }

  public mapToDatabase(): Prisma.SchoolCreateInput {
    return {
      name: this.data.SchoolName,
      clientUuid: this.data.SchoolUUID,
      organizationName: this.data.OrganizationName,
      shortCode: this.data.SchoolShortCode,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
