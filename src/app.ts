import 'newrelic';
import express, { Request, Response, NextFunction } from 'express';
import createError, { HttpError } from 'http-errors';
import indexRouter from './routes';
import './utils/dotenv';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', indexRouter);

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
