import log from '../utils/logging';
import { schoolSchema } from '../validatorsSchemes';
import { Prisma, PrismaClient } from '@prisma/client';

export interface ISchool {
  OrganizationName: string;
  SchoolUUID: string;
  SchoolName: string;
  SchoolShortCode: string;
  ProgramName: string[];
  Source: string;
}

const prisma = new PrismaClient();

export class School {
  public static async insertMany(schools: ValidatedSchool[]): Promise<void> {
    try {
      await prisma.school.createMany({
        data: schools.map((s) => s.mapToDatabase()),
      });
    } catch (error) {
      log.error('Failed to insert schools into database', {
        error,
        schoolIds: schools.map((s) => s.data.SchoolUUID),
      });
    }
  }

  public static async insertOne(schools: ValidatedSchool): Promise<void> {
    try {
      await prisma.school.create({
        data: schools.mapToDatabase(),
      });
    } catch (error) {
      log.error('Failed to insert schools into database', {
        error,
        schoolIds: [schools.data.SchoolUUID],
      });
    }
  }
}

export class ValidatedSchool {
  public data: ISchool;

  private constructor(school: ISchool) {
    this.data = school;
  }

  public static validate(school: ISchool): ValidatedSchool {
    try {
      const { error, value } = schoolSchema.validate(school);
      if (error) throw error;
      return new ValidatedSchool(value);
    } catch (error) {
      log.error(`School failed Validation`, {
        id: school.SchoolUUID,
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

