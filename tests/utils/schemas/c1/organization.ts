export const organizationSchema = {
  title: 'organizationSchema',
  type: 'object',
  required: ['OrganizationName', 'OrganizationUUID'],
  properties: {
    OrganizationName: {
      type: 'string',
    },
    OrganizationUUID: {
      type: 'string',
    },
  },
};
