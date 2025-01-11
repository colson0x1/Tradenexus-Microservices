import { Application } from 'express';
import { verifyGatewayRequest } from '@colson0x1/tradenexus-shared';
import { authRoutes } from '@auth/routes/auth';

/* This is where im going to define all the that we're going to have in the
 * Auth Service
 **/

const BASE_PATH = '/api/v1/auth';

export function appRoutes(app: Application): void {
  /* app.use('', () => console.log('appRoutes')); */
  // Now for the auth route, we need to pass in verifyGatewayRequest middleware
  // verifyGatewayRequest will check if the request going into the auth route,
  // if its coming from the API gateway, if its not coming from the API gateway,
  // it will reject the request.
  app.use(BASE_PATH, verifyGatewayRequest, authRoutes());
}
