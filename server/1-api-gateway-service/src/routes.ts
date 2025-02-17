import { Application } from 'express';
import { healthRoutes } from '@gateway/routes/health';
import { authRoutes } from '@gateway/routes/auth';
import { currentUserRoutes } from '@gateway/routes/current-user';
import { authMiddleware } from '@gateway/services/auth-middleware';
import { searchRoutes } from '@gateway/routes/search';
import { buyerRoutes } from '@gateway/routes/buyer';

const BASE_PATH = '/api/gateway/v1';

/* Every routes will be added to this method */
export const appRoutes = (app: Application) => {
  app.use('', healthRoutes.routes());
  // So here, we have defined the route for auth. So when the request comes
  // from the client, it'll be intercepted by the API gateway. And then on API
  // gateway, we attach if it needs to, it will attach the require JWT token if
  // it exists and then sends the request to the authentication service.
  app.use(BASE_PATH, authRoutes.routes());
  app.use(BASE_PATH, searchRoutes.routes());

  // authMiddleware.verify is just used to verify the token. So for every route
  // that will be required, although we require user to already be logged in
  // before they can access. We are going to verifyUser() and we are also
  // going to check authentication()
  app.use(BASE_PATH, authMiddleware.verifyUser, currentUserRoutes.routes());
  app.use(BASE_PATH, authMiddleware.verifyUser, buyerRoutes.routes());
};

/* @ Endpoints only for health route
 * http://localhost:4000/gateway-health
 * @ Endpoints for other services
 * http://localhost:4000/api/v1/auth/signup
 * */
