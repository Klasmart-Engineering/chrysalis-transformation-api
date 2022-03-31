declare module '@newrelic/pino-enricher' {
  import pino = require('pino');
  const _default: () => pino.logOptions | pino.DestinationStream | undefined;
  export default _default;
}
