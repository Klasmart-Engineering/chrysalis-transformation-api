import { Prisma, PrismaClient, School, Program } from '@prisma/client';
import { handleError } from './errorHandler';

const prisma = new PrismaClient();

const createSchools = async (schools: Prisma.SchoolCreateInput[]) => {
  return await prisma.school.createMany({
    data: schools,
  });
};

const createClasses = async (classes: Prisma.ClassCreateInput[]) => {
  return await prisma.class.createMany({
    data: classes,
  });
};

const storeSchools = async (schools: Prisma.SchoolCreateInput[]) => {
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

const storeClasses = async (classes: Prisma.ClassCreateInput[]) => {
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

const getAllSchools = async (): Promise<School[]> => {
  const schools = await prisma.school.findMany();
  return schools;
};

const getSchoolByName = async (schoolName: string): Promise<School | null> => {
  const query = { where: { name: schoolName } };
  const school = await prisma.school.findFirst(query);

  return school;
};

const getProgramByName = async (programName: string): Promise<Program | null> => {
  const query = { where: { name: programName } };
  const program = await prisma.program.findFirst(query);

  return program;
};

const createPrograms = async (programs: Prisma.ProgramCreateInput[]) => {
  const payload = await prisma.program.createMany({
    data: programs,
    skipDuplicates: true,
  });

  return payload;
};

const createRoles = async (roles: Prisma.RoleCreateInput[]) => {
  const payload = await prisma.role.createMany({
    data: roles,
    skipDuplicates: true,
  });

  return payload;
};

export default {
  client: prisma,

  getAllSchools,
  getSchoolByName,
  getProgramByName,

  createPrograms,
  createRoles,
  storeSchools,
  storeClasses,
};
