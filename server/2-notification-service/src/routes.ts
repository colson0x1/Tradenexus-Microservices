import express, { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

const router: Router = express.Router();

// Health route is only exception route that will not pass through API Gateway
// i.e We're going to be able to access health route from outside and its
// going to return either 200 or 500. It will just be used to check the status
// of the service.
export function healthRoutes(): Router {
  router.get('/notification-health', (_req: Request, res: Response) => {
    res.status(StatusCodes.OK).send('Notification service is healthy and OK.');
  });

  return router;
}
