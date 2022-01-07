import { Prisma, PrismaClient } from '@prisma/client';
import { handleError } from './errorHandler';

const prisma = new PrismaClient();

export const storeSchools = async (schools: Prisma.SchoolCreateInput[]) => {
  try {
    await createSchools(schools);
  } catch (error) {
    await handleError(
      {
        type: 'dbError',
        entity: 'school',
        message: JSON.stringify(error),
      },
      createSchools.bind(schools)
    );
  }
};

const createSchools = async (schools: Prisma.SchoolCreateInput[]) => {
  return await prisma.school.createMany({
    data: schools,
  });
};

export const storeClasses = async (classes: Prisma.ClassCreateInput[]) => {
  try {
    await createClasses(classes);
  } catch (error) {
    await handleError(
      {
        type: 'dbError',
        entity: 'class',
        message: JSON.stringify(error),
      },
      createClasses.bind(classes)
    );
  }
};

const createClasses = async (classes: Prisma.ClassCreateInput[]) => {
  return await prisma.class.createMany({
    data: classes,
  });
};
