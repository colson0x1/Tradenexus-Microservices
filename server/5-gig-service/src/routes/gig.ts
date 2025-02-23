import { gigCreate } from '@gig/controllers/create';
import { gigDelete } from '@gig/controllers/delete';
import { gigUpdate, gigUpdateActive } from '@gig/controllers/update';
import express, { Router } from 'express';

const router: Router = express.Router();

const gigRoutes = (): Router => {
  // Route to create
  router.post('/create', gigCreate);
  router.put('/:gigId', gigUpdate);
  router.put('/active/:gigId', gigUpdateActive);
  router.delete('/:gigId/:sellerId', gigDelete);

  return router;
};

export { gigRoutes };
