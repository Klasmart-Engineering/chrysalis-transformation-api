import './utils/dotenv';
import 'newrelic';
import express, { Request, Response, NextFunction } from 'express';
import { log } from './utils';
import createError, { HttpError } from 'http-errors';
import bodyParser from 'body-parser';
import { v1Router } from './routes/v1';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from './utils/redis';
import { config } from 'dotenv';

config();

const API_KEY = process.env.API_KEY;
if (!API_KEY || API_KEY.length < 3)
  throw new Error(`Must provide an API key to the application`);

const app = express();

const PORT = process.env.PORT || 4200;

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const trace = uuidv4();
  req.headers.trace = trace;
  log.info(`[${req.method}] ${req.path}`, {
    path: req.path,
    method: req.method,
  });
  if (req.header('X-Api-Key') !== API_KEY)
    throw createError(401, 'Unauthorized Request');
  next();
});

app.use('/v1', v1Router);

// catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404));
});

// error handler
app.use((err: HttpError, req: Request, res: Response, nex: NextFunction) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.send(`error ${err.status}: ${err.message}`);
});

async function main() {
  await Redis.initialize();
  app.listen(PORT, () => {
    log.info(`The application is listening on port ${PORT}!`);
  });
}

main().catch((e) => log.error(`App unexpectedly crashed`, { error: e }));
