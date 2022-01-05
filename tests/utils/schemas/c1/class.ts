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
  },
};
