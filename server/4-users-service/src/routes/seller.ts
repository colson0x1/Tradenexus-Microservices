import { seller as createSeller } from '@users/controllers/seller/create';
import { seller as updateSeller } from '@users/controllers/seller/update';
import express, { Router } from 'express';

const router: Router = express.Router();

const sellerRoutes = (): Router => {
  router.post('/create', createSeller);
  router.put('/:sellerId', updateSeller);

  return router;
};

export { sellerRoutes };
