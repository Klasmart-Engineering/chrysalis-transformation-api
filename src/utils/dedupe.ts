import {
  ClassQuerySchema,
  SchoolQuerySchema,
  UserQuerySchema,
} from '../interfaces/clientSchemas';
import { log } from './logging';

export const dedupeSchools = (schools: SchoolQuerySchema[]) => {
  const dedupeResult = schools.reduce(
    (
      acc: { uniqueSchools: SchoolQuerySchema[]; duplicateSchoolIds: string[] },
      school
    ) => {
      if (acc.uniqueSchools.some((el) => el.SchoolUUID === school.SchoolUUID)) {
        acc.duplicateSchoolIds.push(school.SchoolUUID);
      } else {
        acc.uniqueSchools.push(school);
      }
      return acc;
    },
    { uniqueSchools: [], duplicateSchoolIds: [] }
  );
  if (dedupeResult.duplicateSchoolIds.length) {
    log.info(
      { duplicatedIds: dedupeResult.duplicateSchoolIds },
      'Duplicate school ids'
    );
  }
  return dedupeResult.uniqueSchools;
};

export const dedupeClasses = (classes: ClassQuerySchema[]) => {
  const dedupeResult = classes.reduce(
    (
      acc: { uniqueClasses: ClassQuerySchema[]; duplicateClassIds: string[] },
      clazz
    ) => {
      if (acc.uniqueClasses.some((el) => el.ClassUUID === clazz.ClassUUID)) {
        acc.duplicateClassIds.push(clazz.ClassUUID);
      } else {
        acc.uniqueClasses.push(clazz);
      }
      return acc;
    },
    { uniqueClasses: [], duplicateClassIds: [] }
  );
  if (dedupeResult.duplicateClassIds.length) {
    log.info(
      { duplicatedIds: dedupeResult.duplicateClassIds },
      'Duplicate class ids'
    );
  }
  return dedupeResult.uniqueClasses;
};

export const dedupeUsers = (users: UserQuerySchema[]) => {
  const dedupeResult = users.reduce(
    (
      acc: { uniqueUsers: UserQuerySchema[]; duplicateUserIds: string[] },
      user
    ) => {
      if (acc.uniqueUsers.some((el) => el.UserUUID === user.UserUUID)) {
        acc.duplicateUserIds.push(user.UserUUID);
      } else {
        acc.uniqueUsers.push(user);
      }
      return acc;
    },
    { uniqueUsers: [], duplicateUserIds: [] }
  );
  if (dedupeResult.duplicateUserIds.length) {
    log.info(
      { duplicatedIds: dedupeResult.duplicateUserIds },
      'Duplicate user ids'
    );
  }
  return dedupeResult.uniqueUsers;
};
