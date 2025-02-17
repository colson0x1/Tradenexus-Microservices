import { verifyGatewayRequest } from '@colson0x1/tradenexus-shared';
import { Application } from 'express';
import { buyerRoutes } from '@users/routes/buyer';
import { healthRoutes } from '@users/routes/health';

// This will be the path that will be coming from the API gateway to the
// Users service
const BUYER_BASE_PATH = '/api/v1/buyer';
const SELLER_BASE_PATH = '/api/v1/seller';

const appRoutes = (app: Application): void => {
  // Domain middleware
  /* app.use('', () => console.log('health routes')); */
  app.use('', () => healthRoutes);
  // Verify gateway request for buyer and seller
  /* app.use(BUYER_BASE_PATH, verifyGatewayRequest, () => console.log('buyer routes')); */
  app.use(BUYER_BASE_PATH, verifyGatewayRequest, () => buyerRoutes);
  app.use(SELLER_BASE_PATH, verifyGatewayRequest, () => console.log('seller routes'));
};

export { appRoutes };
