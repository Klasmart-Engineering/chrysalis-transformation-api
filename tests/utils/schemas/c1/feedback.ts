export const feedbackSchema = {
  title: 'feedbackSchema',
  type: 'object',
  required: ['Status', 'Messages'],
  properties: {
    Status: {
      type: 'boolean',
    },
    Messages: {
      type: 'string',
    },
  },
};
