import { read, resendEmail } from '@auth/controllers/current-user';
import express, { Router } from 'express';

const router: Router = express.Router();

export function currentUserRoutes(): Router {
  router.get('/currentuser', read);
  router.post('/resend-email', resendEmail);

  return router;
}
