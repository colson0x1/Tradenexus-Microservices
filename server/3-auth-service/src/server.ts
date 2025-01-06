import { IAuthPayload, winstonLogger } from '@colson0x1/tradenexus-shared';
import { Logger } from 'winston';
import { config } from '@auth/config';
import { Application, NextFunction, Request, Response } from 'express';
import hpp from 'hpp';
import helmet from 'helmet';
import cors from 'cors';
import { verify } from 'jsonwebtoken';

const SERVER_PORT = 4002;
const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authenticationServer', 'debug');

export function start(app: Application): void {}

function securityMiddleware(app: Application): void {
  app.set('trust proxy', 1);
  app.use(hpp());
  app.use(helmet());
  app.use(
    // The basic idea for cors is so that the frontend and backend can
    // communicate because they're going to be using different origins.
    cors({
      // Because we're not getting the request directly from the frontend so
      // So the request is coming from the API Gateway. So for the Auth Service,
      // the API Gateway will be its client and then for the API Gateway, the
      // frontend will be its client.
      origin: config.API_GATEWAY_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    })
  );
  // The normal JWT token, not the gateway jwt token, so the normal jwt token
  // will be attached to every request that is coming from the client,
  // that is the from the frontend. So once the request goes from frontend
  // to API Gateway, and then from API Gateway to the Auth Service, we'll
  // check if we have this token i.e JWT_TOKEN. The reason why we're checking
  // for this token is because im going to add a particular path to this service
  // that will require the user to be logged in, in order for them to access it
  // i.e to get current user.
  // So to get the current user, the user has to be logged in.
  app.use((req: Request, _res: Response, next: NextFunction) => {
    // Check if we have the token i.e JWT_TOKEN, in the authorization header
    // because when im sending it from the API gateway, im going to add
    // to the headers a token like this:
    // i.e 'BEARER 12345abcdef67890s'
    // i.e Every request that is coming from the API gateway, im going to
    // check in the authorization header if I have a token i.e if i have a
    // Bearer token. If the authorization doesn't exist, then its going to
    // throw an error and the request will not be allowed. Otherwise, we get
    // the request, get the verified payload and then set the payload to the
    // `currentUser`.
    // So that is what I want to check so
    if (req.headers.authorization) {
      // So if we have authorization property in the headers, then we need to
      // get the token so
      // Im going to split with space: 'Bearer' and the token '12345abcdef67890s'
      // i.e ['Bearer', '12345abcdef67890s']
      // So we're spliting with space here and we get the second item i.e of
      // index 1 that has the token
      const token = req.headers.authorization.split(' ')[1];
      // Now verify it its a valid token
      const payload: IAuthPayload = verify(token, config.JWT_TOKEN!) as IAuthPayload;
      // Once we get our payload, we need to set it to `req.currentUser`
      req.currentUser = payload;
    }
    next();
  });

  // Here im not adding anything related to cookie session because its handled
  // on the Api Gateway
}
