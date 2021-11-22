import express, { Request, Response, NextFunction} from 'express';
import logger from 'morgan';
import createError, { HttpError } from 'http-errors';
import indexRouter from './routes';

const app = express();

const PORT = process.env.PORT || 4200;

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));

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

app.listen(PORT, () => {
    /* eslint-disable no-console */
    console.log(`The application is listening on port ${PORT} !`);
});

