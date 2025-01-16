// For this, we don't need this to actually be verified. Because its not likely
// going to be coming from the API gateway. So I created a new route.

import { health } from '@auth/controllers/health';
import express, { Router } from 'express';

const router: Router = express.Router();

export function healthRoutes(): Router {
  router.get('/auth-health', health);

  return router;
}
