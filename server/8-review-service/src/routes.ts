import { verifyGatewayRequest } from '@colson0x1/tradenexus-shared';
import { Application } from 'express';
import { healthRoutes } from '@review/routes/health';
import { reviewRoutes } from '@review/routes/review';

const BASE_PATH = '/api/v1/review';

const appRoutes = (app: Application): void => {
  // Test endpoint before verifyGatewayRequest
  /*
  app.get('/test', (_req, res) => {
    console.log('Test endpoint hit');
    res.json({ message: 'Review service is reachable' });
  }); */
  // The better way to do that `/test` is creating a health route.
  // Domain middleware
  /* app.use('', () => console.log('health routes')); */
  app.use('', () => healthRoutes());

  /* app.use(BASE_PATH, verifyGatewayRequest, () => console.log('review routes')); */
  app.use(BASE_PATH, verifyGatewayRequest, () => reviewRoutes());
};

export { appRoutes };
