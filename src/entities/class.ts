import { PrismaClient, Prisma } from '@prisma/client';

import log from '../utils/logging';
import { classSchema } from '../validatorsSchemes';

export interface IClass {
  OrganizationName: string;
  ClassUUID: string;
  ClassName: string;
  ClassShortCode: string;
  ProgramName: string[];
  SchoolName: string;
}

const prisma = new PrismaClient();

export class Class {
  public static async insertMany(
    classDetails: ValidatedClass[]
  ): Promise<void> {
    try {
      await prisma.class.createMany({
        data: classDetails.map((c) => c.mapToDatabase()),
      });
    } catch (error) {
      log.error('Failed to insert classes into database', {
        error,
        classIds: classDetails.map((c) => c.data.ClassUUID),
      });
    }
  }

  public static async insertOne(classDetails: ValidatedClass): Promise<void> {
    try {
      await prisma.class.create({
        data: classDetails.mapToDatabase(),
      });
    } catch (error) {
      log.error('Failed to insert class into database', {
        error,
        classIds: [classDetails.data.ClassUUID],
      });
    }
  }
}

export class ValidatedClass {
  public data: IClass;

  private constructor(classDetails: IClass) {
    this.data = classDetails;
  }

  public static validate(c: IClass): ValidatedClass {
    try {
      const { error, value } = classSchema.validate(c);
      if (error) throw error;


      return new ValidatedClass(value);
    } catch (error) {
      log.error(`School failed Validation`, {
        id: c.ClassUUID,
        error,
      });
      throw new Error('Validation failed');
    }
  }

  public mapToDatabase(): Prisma.ClassCreateInput {
    // @TODO
    return {
    name: string
    klUuid: string
    klOrgUuid: string
    clientUuid: string
    shortCode?: string | null
    organizationName: string
    schoolName: string
    client?: string | null
    status?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    programNames?: ClassCreateprogramNamesInput | Enumerable<string>
    errors?: ClassCreateerrorsInput | Enumerable<string>
    };
  }
}
