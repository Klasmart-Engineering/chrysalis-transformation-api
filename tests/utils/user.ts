import { userSchema } from '../../src/validatorsSchemes';

export const validUser =  {
  userUuid: '1AF7592D-E9D4-4E1E-9C39-2F0E48854439',
  klUuid: '1AF7592D-E9D4-4E1E-9C39-2F0E48854439',
  userGivenName: 'Molika',
  userFamilyName: 'SANDEEP',
  email: null,
  phone: '+919540253063',
  dateOfBirth: null,
  gender: 'Female',
  klRoleName: [
    'Chrysalis Student'
  ],
  schoolName: 'Bharti Model School',
  className: [
    'III A NEW0007561'
  ],
  username: 'abcdefgh',
};

export const invalidUser =  {
  userUuid: '1AF7592D-E9D4-',
  klUuid: '1AF7592D-E9D4-4E1E-9C39-2F0E48854439',
  userGivenName: '',
  userFamilyName: 'SANDEEP',
  email: 'abcdefgh',
  phone: '+919540253063',
  dateOfBirth: null,
  gender: 'Female',
  klRoleName: [
    'Chrysalis Student'
  ],
  schoolName: 'Bharti Model School',
  className: [
    'III A NEW0007561'
  ],
  username: 'abcdefgh',
};

interface User {
  userUuid: string;
  klUuid: string,
  userGivenName: string,
  userFamilyName: string,
  email: string | null,
  phone: string | null,
  dateOfBirth: string | null,
  gender: string,
  klRoleName: string[],
  schoolName: string,
  className: string[],
}

export const isUserValid = (userData: User) => {
  try {
    const { error } = userSchema.validate(userData, { abortEarly: false });
    return !error;
  } catch (error) {
    return false;
  }
};
