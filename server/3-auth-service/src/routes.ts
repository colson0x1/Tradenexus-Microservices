import { Application } from 'express';
import { verifyGatewayRequest } from '@colson0x1/tradenexus-shared';
import { authRoutes } from '@auth/routes/auth';
import { currentUserRoutes } from '@auth/routes/current-user';

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
  /* app.use(BASE_PATH, verifyGatewayRequest, authRoutes()); */
  // @ Log the request headers
  /*
  app.use(
    BASE_PATH,
    (req: Request) => {
      console.log(req.headers);
    },
    () => console.log('auth')
  );
  */
  app.use(BASE_PATH, verifyGatewayRequest, authRoutes());
  // I simply separated authRoutes and currentUserRoutes because the authRoutes(),
  // they are mostly not protected routes. So they are requests that the user will
  // make when they are not logged in. And then currentUserRoutes, they are
  // requests that the user will make when they are logged in. So I decided to
  // separate them and create two routes. Hence, authRoutes requires users to be
  // not logged in whereas currentUserRoutes requires users to be logged in!
  app.use(BASE_PATH, verifyGatewayRequest, currentUserRoutes());
}
