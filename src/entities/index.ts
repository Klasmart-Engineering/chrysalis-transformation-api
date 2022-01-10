export enum Entity {
  ORGANIZATION = 'Organization',
  SCHOOL = 'School',
  CLASS = 'Class',
  USER = 'User',
  ROLE = 'Role',
  PROGRAM = 'Program',
  UNKNOWN = 'Unknown',
}

export * from './class';
export * from './organization';
export * from './program';
export * from './role';
export * from './school';
export * from './user';
