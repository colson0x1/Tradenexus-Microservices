import { verifyGatewayRequest } from '@colson0x1/tradenexus-shared';
import { Application } from 'express';

const BASE_PATH = '/api/v1/message';

const appRoutes = (app: Application): void => {
  // Test endpoint before verifyGatewayRequest
  /*
  app.get('/test', (_req, res) => {
    console.log('Test endpoint hit');
    res.json({ message: 'Chat service is reachable' });
  }); */
  // The better way to do that `/test` is creating a health route.
  // Domain middleware
  app.use('', () => console.log('health routes'));

  app.use(BASE_PATH, verifyGatewayRequest, () => console.log('Chat routes'));
};

export { appRoutes };
