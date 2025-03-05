import http from 'http';

import { CustomError, IAuthPayload, IErrorResponse, winstonLogger } from '@colson0x1/tradenexus-shared';
import { Logger } from 'winston';
import { config } from '@gig/config';
import { Application, json, NextFunction, Request, Response, urlencoded } from 'express';
import hpp from 'hpp';
import helmet from 'helmet';
import cors from 'cors';
import { verify } from 'jsonwebtoken';
import compression from 'compression';
import { checkConnection, createIndex } from '@gig/elasticsearch';
import { StatusCodes } from 'http-status-codes';
import { appRoutes } from '@gig/routes';
import { createConnection } from '@gig/queues/connection';
import { Channel } from 'amqplib';
import { consumeGigDirectMessage, consumeSeedDirectMessage } from '@gig/queues/gig.consumer';

const SERVER_PORT = 4004;
const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'gigServer', 'debug');
// Im defining channel outside of `startQueues` because im going to need this
// variable outside od this file.
let gigChannel: Channel;

const start = (app: Application): void => {
  securityMiddleware(app);
  standardMiddleware(app);
  routesMiddleware(app);
  startQueues();
  startElasticSearch();
  gigErrorHandler(app);
  startServer(app);
};

const securityMiddleware = (app: Application): void => {
  app.set('trust proxy', 1);
  app.use(hpp());
  app.use(helmet());
  app.use(
    // The basic idea for cors is so that the frontend and backend can
    // communicate because they're going to be using different origins.
    cors({
      // Because we're not getting the request directly from the frontend so
      // So the request is coming from the API Gateway. So for the Gig Service,
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
  // to API Gateway, and then from API Gateway to the Gig Service, we'll
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
    // i.e I want to `verify` the token that will be added to the request
    // headers when the request comes from the API gateway!
    // So I verify the token. If the token is valid then i get the `payload`
    // and set it to `req.currentUser` and then call `next` so that i can
    // proceed to the next function or the next callback.
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
};

// @ middleware with the compressed JSON URL encoded
// We're setting json() and urlencoded() so that we can be able to send
// JSON data and also we can use req.body while the above compression()
// will enable the request size to be compressed so we don't have a very
// large size when sending the data across to the server. That is what this
// standardMiddleware does.
const standardMiddleware = (app: Application): void => {
  // This will just be used to compress the request to make it the size
  // lower or to reduce the size
  app.use(compression());
  // setting maximum size of our json request
  app.use(json({ limit: '200mb' }));
  // Because we're going to be passing data through request.body so we need
  // to setup urlencoded cause without this, we won't be able to set up
  // our request.body
  // So with this middleware right below, when we send data through the body
  // through a POST request, we can get it via request.body
  app.use(urlencoded({ extended: true, limit: '200mb' }));
};

const routesMiddleware = (app: Application): void => {
  appRoutes(app);
};

const startQueues = async (): Promise<void> => {
  // im exporting this `gigChannel` because i'll make use of this probably in
  // this service when i publish an event or publish a message.
  gigChannel = (await createConnection()) as Channel;
  await consumeGigDirectMessage(gigChannel);
  await consumeSeedDirectMessage(gigChannel);
  await consumeSeedDirectMessage(gigChannel);
};

const startElasticSearch = (): void => {
  checkConnection();
  createIndex('gigs');
};

const gigErrorHandler = (app: Application): void => {
  // Here only just have to catch any error that is of type CustomError

  // Check for CustomError
  // So here we're using this to catch all the errors that we have in the
  // application and then we log the errors. In the error object, we have
  // `comingFrom` property so we're logging the error and its going to send
  // the error to Elasticsearch and Kibana.
  // But the errors that we want to send to API gateway so that it can
  // send it back to the user is an error object that is of type CustomError.
  // So for exmaple, if the user tries to log in with invalid credentials,
  // we're going to send the invalid credentials error message to the user.
  // So because its client side errror, we're going to send it to the user.
  // that is what it means in: `if (error instsanceof CustomError) {}`
  app.use((error: IErrorResponse, _req: Request, res: Response, next: NextFunction) => {
    log.log('error', `GigService ${error.comingFrom}:`, error);
    // CustomError is the name of the abstract class and each of the error
    // class is extending from CustomError
    // If error object we get is of type CustomError i.e if the error instance
    // is of type CustomError, then
    if (error instanceof CustomError) {
      res.status(error.statusCode).json(error.serializeErrors());
    }
    res.status(StatusCodes.NOT_FOUND).json({ message: 'The endpoint called does not exist.' });
    // res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Something went wrong' });
    next();
  });
};

const startServer = (app: Application): void => {
  try {
    const httpServer: http.Server = new http.Server(app);
    log.info(`Gig server has started with process id ${process.pid}`);
    httpServer.listen(SERVER_PORT, () => {
      log.info(`Gig server running on port ${SERVER_PORT}`);
    });
  } catch (error) {
    log.error('error', 'GigService startServer() method error', error);
  }
};

export { start, gigChannel };
