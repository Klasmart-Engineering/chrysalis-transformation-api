import 'newrelic';
import express, { Request, Response, NextFunction } from 'express';
import createError, { HttpError } from 'http-errors';
import indexRouter from './routes';
import './utils/dotenv';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

const swaggerDocs = YAML.load('./api-docs.yaml');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', indexRouter);
app.use('/documentation', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

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

export default app;
