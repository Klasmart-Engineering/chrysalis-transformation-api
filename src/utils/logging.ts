import winstonEnricher from '@newrelic/winston-enricher';
import { createLogger, format, transports } from 'winston';

const logFormat = format.printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${level}]: ${message} service: ${label}`;
});

const devOutput = [
  format.colorize(),
  format.timestamp(),
  format.label({ label: 'default' }),
  logFormat,
];
const newRelicOutput = [
  format.timestamp(),
  format.label({ label: 'default' }),
  winstonEnricher(),
];

const logger = createLogger({
  level: 'info',
  format: format.combine(
    ...(process.env.NEW_RELIC_LICENSE_KEY ? newRelicOutput : devOutput)
  ),
  defaultMeta: { service: 'cil' },
  transports: [
    //
    // - Write to all logs with level `info` and below to `cil-combined.log`.
    // - Write all logs error (and below) to `cil-error.log`.
    //
    new transports.File({
      filename: 'cil-error.log',
      level: 'error',
    }),
    new transports.File({ filename: 'cil-combined.log' }),
  ],
});

//
// If we're not in production then **ALSO** log to the `console`
// with the colorized simple format.
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    })
  );
}

export default logger;
