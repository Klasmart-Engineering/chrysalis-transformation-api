export const classSchema = {
  title: 'classSchema',
  type: 'object',
  required: [
    'OrganizationName',
    'ClassUUID',
    'ClassName',
    'ClassShortCode',
    'ProgramName',
    'SchoolName',
    'OrganizationUUID',
    'SchoolUUID',
  ],
  properties: {
    OrganizationName: {
      type: 'string',
    },
    ClassUUID: {
      type: 'string',
    },
    ClassName: {
      type: 'string',
    },
    ClassShortCode: {
      type: 'string',
    },
    ProgramName: {
      type: 'array',
    },
    SchoolName: {
      type: 'string',
    },
    OrganizationUUID: {
      type: 'string',
    },
    SchoolUUID: {
      type: 'string',
    },
  },
};
