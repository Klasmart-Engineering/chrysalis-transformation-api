import 'newrelic';
import express, { Request, Response, NextFunction } from 'express';
import './utils/dotenv';
import createError from 'http-errors';
import { checkAPIToken } from './middlewares/checkAPIToken';
import OnboardRouter from './routes/onboardRouter';
import HealthRouter from './routes/healthRouter';
import { HttpError } from './utils';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

const swaggerDocs = YAML.load('./api-docs.yaml');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/onboard', checkAPIToken, OnboardRouter);
app.use('/health', HealthRouter);
app.use('/documentation', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404));
});

// error handler
app.use((err: HttpError, req: Request, res: Response, nex: NextFunction) => {
  res.locals.message = err.body;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.send(err.body);
});

export default app;
