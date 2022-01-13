import app from './app';
import logger from './utils/logging';
import './utils/dotenv';

const { PORT = 4200, API_SECRET } = process.env;

if (!API_SECRET) {
  logger.error(`The API_SECRET environment variable was not set`);
  throw Error(`The API_SECRET environment variable was not set`);
}

app.listen(PORT, () => {
  /* eslint-disable no-console */
  logger.info(`The application is listening on port ${PORT}!`);
});
