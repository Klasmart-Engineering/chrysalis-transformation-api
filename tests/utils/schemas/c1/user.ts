export const userSchema = {
  title: 'userSchema',
  type: 'object',
  required: [
    'OrganizationName',
    'UserUUID',
    'UserGivenName',
    'UserFamilyName',
    'Phone',
    'Gender',
    'KLRoleName',
    'SchoolName',
    'SchoolUUID',
    'SchoolRoleName',
    'OrganizationUUID',
    'ClassInformation',
  ],
  properties: {
    OrganizationName: {
      type: 'string',
    },
    UserUUID: {
      type: 'string',
    },
    UserGivenName: {
      type: 'string',
    },
    UserFamilyName: {
      type: 'string',
    },
    Email: {
      type: ['string', 'null'],
    },
    Phone: {
      type: 'string',
    },
    DateOfBirth: {
      type: ['string', 'null'],
    },
    Gender: {
      type: 'string',
    },
    KLRoleName: {
      type: 'array',
    },
    SchoolName: {
      type: 'string',
    },
    SchoolUUID: {
      type: 'string',
    },
    SchoolRoleName: {
      type: 'array',
    },
    OrganizationUUID: {
      type: 'string',
    },
    ClassInformation: {
      type: 'array',
    },
  },
};
