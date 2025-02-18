import { verifyGatewayRequest } from '@colson0x1/tradenexus-shared';
import { Application } from 'express';
import { buyerRoutes } from '@users/routes/buyer';
import { healthRoutes } from '@users/routes/health';
import { sellerRoutes } from '@users/routes/seller';

// This will be the path that will be coming from the API gateway to the
// Users service
const BUYER_BASE_PATH = '/api/v1/buyer';
const SELLER_BASE_PATH = '/api/v1/seller';

const appRoutes = (app: Application): void => {
  // Test endpoint before verifyGatewayRequest
  /*
  app.get('/test', (_req, res) => {
    console.log('Test endpoint hit');
    res.json({ message: 'Users service is reachable' });
  }); */
  // The better way to do that `/test` is creating a health route.

  // Domain middleware
  /* app.use('', () => console.log('health routes')); */
  app.use('', healthRoutes());

  // Verify gateway request for buyer and seller
  /* app.use(BUYER_BASE_PATH, verifyGatewayRequest, () => console.log('buyer routes')); */
  app.use(BUYER_BASE_PATH, verifyGatewayRequest, buyerRoutes());

  /* app.use(SELLER_BASE_PATH, verifyGatewayRequest, () => console.log('seller routes')); */
  app.use(SELLER_BASE_PATH, verifyGatewayRequest, sellerRoutes());
  /* app.use(
    SELLER_BASE_PATH,
    (req, _res, next) => {
      console.log('Request received at seller base path:', {
        method: req.method,
        path: req.path,
        headers: req.headers
      });
      next();
    },
    verifyGatewayRequest,
    sellerRoutes()
  ); */
};

export { appRoutes };
