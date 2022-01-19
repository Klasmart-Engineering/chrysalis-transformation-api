import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils';

export const checkAPIToken = (req: Request, res: Response, next: NextFunction) => {
	const apiSecret = req.get('X_API_SECRET');

	if (apiSecret !== process.env.API_SECRET) {
		throw new HttpError(401, { message: "Unauthorized." });
	}

	next();
}