import { review } from '@review/controllers/create';
import { reviewsByGigId, reviewsBySellerId } from '@review/controllers/get';
import express, { Router } from 'express';

const router: Router = express.Router();

const reviewRoutes = (): Router => {
  // @ GET routes
  router.get('/gig/:gigId', reviewsByGigId);
  router.get('/seller/:sellerId', reviewsBySellerId);

  // @ CREATE/POST routes
  router.get('/', review);

  return router;
};

export { reviewRoutes };
