export const alreadyProcessed = {
  title: 'alreadyProcessed',
  type: 'object',
  required: ['message', 'alreadyProcessed', 'feedback'],
  properties: {
    message: {
      type: 'string',
    },
    alreadyProcessed: {
      type: 'array',
    },
    feedback: {
      type: 'array',
    },
  },
};
