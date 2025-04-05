import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export function health(_req: Request, res: Response): void {
  // If its healthy, it will return 200. Otherwise it will return 500 like so.
  res.status(StatusCodes.OK).send('Review service is healthy and OK.');
}
