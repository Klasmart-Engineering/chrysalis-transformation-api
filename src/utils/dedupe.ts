import {
  ClassQuerySchema,
  SchoolQuerySchema,
  UserQuerySchema
} from "../interfaces/clientSchemas";
import logger from "./logging";

export const dedupeSchools = (schools: SchoolQuerySchema[]) => {
  const dedupeResult = schools.reduce((
    acc: {uniqueSchools: SchoolQuerySchema[], duplicateSchoolIds: string[]},
    school
  ) => {
    if (acc.uniqueSchools.some(el => el.SchoolUUID === school.SchoolUUID)) {
      acc.duplicateSchoolIds.push(school.SchoolUUID);
    } else {
      acc.uniqueSchools.push(school);
    }
    return acc;
  }, {uniqueSchools: [], duplicateSchoolIds: []})
  if (dedupeResult.duplicateSchoolIds.length) {
    logger.info('Duplicate school ids:', dedupeResult.duplicateSchoolIds);
  }
  return dedupeResult.uniqueSchools;
}

export const dedupeClasses = (classes: ClassQuerySchema[]) => {
  const dedupeResult = classes.reduce((
    acc: {uniqueClasses: ClassQuerySchema[], duplicateClassIds: string[]},
    clazz
  ) => {
    if (acc.uniqueClasses.some(el => el.ClassUUID === clazz.ClassUUID)) {
      acc.duplicateClassIds.push(clazz.ClassUUID);
    } else {
      acc.uniqueClasses.push(clazz);
    }
    return acc;
  }, {uniqueClasses: [], duplicateClassIds: []});
  if (dedupeResult.duplicateClassIds.length) {
    logger.info('Duplicate class ids:', dedupeResult.duplicateClassIds);
  }
  return dedupeResult.uniqueClasses;
}

export const dedupeUsers = (users: UserQuerySchema[]) => {
  const dedupeResult = users.reduce((
    acc: {uniqueUsers: UserQuerySchema[], duplicateUserIds: string[]},
    user
  ) => {
    if (acc.uniqueUsers.some(el => el.UserUUID === user.UserUUID)) {
      acc.duplicateUserIds.push(user.UserUUID);
    } else {
      acc.uniqueUsers.push(user);
    }
    return acc;
  }, {uniqueUsers: [], duplicateUserIds: []});
  if (dedupeResult.duplicateUserIds.length) {
    logger.info('Duplicate user ids:', dedupeResult.duplicateUserIds);
  }
  return dedupeResult.uniqueUsers;
}
