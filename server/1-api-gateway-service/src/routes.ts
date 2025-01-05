import { Application } from 'express';
import { healthRoutes } from '@gateway/routes/health';

/* Every routes will be added to this method */
export const appRoutes = (app: Application) => {
  app.use('', healthRoutes.routes());
};

/* @ Endpoints only for health route
 * http://localhost:4000/gateway-health
 * @ Endpoints for other services
 * http://localhost:4000/api/v1/auth/signup
 * */
