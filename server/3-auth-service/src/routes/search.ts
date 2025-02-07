import { gigs, singleGigById } from '@auth/controllers/search';
import express, { Router } from 'express';

const router: Router = express.Router();

export function searchRoutes(): Router {
  // This will be the command that will be used when the user types into the
  // search box
  router.get('/search/gig/:from/:size/:type', gigs);
  // Second route is just for the single gig id
  router.get('/search/gig/:gigId', singleGigById);

  return router;
}
