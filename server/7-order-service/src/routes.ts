import { verifyGatewayRequest } from '@colson0x1/tradenexus-shared';
import { Application } from 'express';
import { healthRoutes } from '@order/routes/health';
import { orderRoutes } from '@order/routes/order';

const BASE_PATH = '/api/v1/order';

const appRoutes = (app: Application): void => {
  // Test endpoint before verifyGatewayRequest
  /*
  app.get('/test', (_req, res) => {
    console.log('Test endpoint hit');
    res.json({ message: 'Order service is reachable' });
  }); */
  // The better way to do that `/test` is creating a health route.
  // Domain middleware
  /* app.use('', () => console.log('health routes')); */
  app.use('', () => healthRoutes());

  /* app.use(BASE_PATH, verifyGatewayRequest, () => console.log('order routes')); */
  app.use(BASE_PATH, verifyGatewayRequest, () => orderRoutes());
};

export { appRoutes };
