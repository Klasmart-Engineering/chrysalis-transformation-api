export const c1SchoolSchema = {
  title: 'schoolSchema',
  type: 'object',
  required: ['OrganizationName', 'SchoolUUID', 'SchoolName', 'SchoolShortCode', 'ProgramName', 'Source'],
  properties: {
    OrganizationName: {
      type: 'string',
    },
    SchoolUUID: {
      type: 'string'
    },
    SchoolName: {
      type: 'string',
    },
    SchoolShortCode: {
      type: 'string',
    },
    ProgramName: {
      type: 'array',
    },
    Source: {
      type: 'string',
    },
  }
};
