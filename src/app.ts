import 'newrelic';
import express, { Request, Response, NextFunction } from 'express';
import './utils/dotenv';
import createError from 'http-errors';
import { checkAPIToken } from './middlewares/checkAPIToken';
import OnboardRouter from './routes/onboardRouter';
import LinkRouter from './routes/linkRouter';
import { HttpError } from './utils';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/onboard', checkAPIToken, OnboardRouter);
app.use('/link', checkAPIToken, LinkRouter);

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
