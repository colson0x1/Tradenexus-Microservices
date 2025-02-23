import { gig } from '@gig/controllers/create';
import express, { Router } from 'express';

const router: Router = express.Router();

const gigRoutes = (): Router => {
  // Route to create
  router.post('/create', gig);

  return router;
};

export { gigRoutes };
