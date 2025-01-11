import { Application } from 'express';
import { healthRoutes } from '@gateway/routes/health';
import { authRoutes } from '@gateway/routes/auth';

const BASE_PATH = '/api/gateway/v1';

/* Every routes will be added to this method */
export const appRoutes = (app: Application) => {
  app.use('', healthRoutes.routes());
  // So here, we have defined the route for auth. So when the request comes
  // from the client, it'll be intercepted by the API gateway. And then on API
  // gateway, we attach if it needs to, it will attach the require JWT token if
  // it exists and then sends the request to the authentication service.
  app.use(BASE_PATH, authRoutes.routes());
};

/* @ Endpoints only for health route
 * http://localhost:4000/gateway-health
 * @ Endpoints for other services
 * http://localhost:4000/api/v1/auth/signup
 * */
