import { read, resendEmail } from '@auth/controllers/current-user';
import { token } from '@auth/controllers/refresh-token';
import express, { Router } from 'express';

const router: Router = express.Router();

export function currentUserRoutes(): Router {
  // Since this refresh token is going to be coming from the API gateway, it
  // makes more sense to verify that its coming from the API gateway. So this
  // is why I added this to the /currentuser route and not a separate route.
  router.get('/refresh-token/:username', token);
  router.get('/currentuser', read);
  router.post('/resend-email', resendEmail);

  return router;
}
