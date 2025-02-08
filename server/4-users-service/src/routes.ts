import { verifyGatewayRequest } from '@colson0x1/tradenexus-shared';
import { Application } from 'express';

// This will be the path that will be coming from the API gateway to the
// Users service
const BUYER_BASE_PATH = '/api/v1/buyer';
const SELLER_BASE_PATH = '/api/v1/seller';

const appRoutes = (app: Application): void => {
  // Domain middleware
  app.use('', () => console.log('health routes'));
  // Verify gateway request for buyer and seller
  app.use(BUYER_BASE_PATH, verifyGatewayRequest, () => console.log('buyer routes'));
  app.use(SELLER_BASE_PATH, verifyGatewayRequest, () => console.log('seller routes'));
};

export { appRoutes };
