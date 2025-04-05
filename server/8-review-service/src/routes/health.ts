import { health } from '@review/controllers/health';
import express, { Router } from 'express';

const router: Router = express.Router();

const healthRoutes = (): Router => {
  // @ GET routes
  router.get('/review-health', health);

  return router;
};

export { healthRoutes };
