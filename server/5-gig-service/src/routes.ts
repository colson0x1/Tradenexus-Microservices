import { verifyGatewayRequest } from '@colson0x1/tradenexus-shared';
import { gigRoutes } from '@gig/routes/gig';
import { healthRoutes } from '@gig/routes/health';
import { Application } from 'express';

const BASE_PATH = '/api/v1/gig';

const appRoutes = (app: Application): void => {
  // Test endpoint before verifyGatewayRequest
  /*
  app.get('/test', (_req, res) => {
    console.log('Test endpoint hit');
    res.json({ message: 'Gig service is reachable' });
  }); */
  // The better way to do that `/test` is creating a health route.
  // Domain middleware
  /* app.use('', () => console.log('health routes')); */
  app.use('', healthRoutes());

  /* app.use(BASE_PATH, verifyGatewayRequest, () => console.log('gig routes')); */
  app.use(BASE_PATH, verifyGatewayRequest, gigRoutes());
  app.use(BASE_PATH, verifyGatewayRequest, () => console.log('search routes'));
};

export { appRoutes };
