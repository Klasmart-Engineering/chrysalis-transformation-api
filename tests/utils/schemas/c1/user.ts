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
    'ClassName',
    'SchoolRoleName',
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
    ClassName: {
      type: 'array',
    },
    SchoolRoleName: {
      type: 'array',
    },
  },
};
