import { gigCreate } from '@gig/controllers/create';
import { gigDelete } from '@gig/controllers/delete';
import { gigById, gigsByCategory, moreLikeThis, sellerGigs, sellerInactiveGigs, topRatedGigsByCategory } from '@gig/controllers/get';
import { gigs } from '@gig/controllers/search';
import { gig } from '@gig/controllers/seed';
import { gigUpdate, gigUpdateActive } from '@gig/controllers/update';
import express, { Router } from 'express';

const router: Router = express.Router();

const gigRoutes = (): Router => {
  router.get('/:gigId', gigById);
  router.get('/seller/:sellerId', sellerGigs);
  router.get('/seller/pause/:sellerId', sellerInactiveGigs);
  // Its okay to add search into gigRoutes in this case but better to separate
  // into its own route
  router.get('/search/:from/:size/:type', gigs);
  router.get('/category/:username', gigsByCategory);
  // `/:username` because im using the `username` in `gigsByCategory` in the
  // get controller
  router.get('/top/:username', topRatedGigsByCategory);
  router.get('/similar/:gigId', moreLikeThis);

  router.post('/create', gigCreate);

  router.put('/:gigId', gigUpdate);
  router.put('/active/:gigId', gigUpdateActive);
  router.put('/seed/:count', gig);

  router.delete('/:gigId/:sellerId', gigDelete);

  return router;
};

export { gigRoutes };
