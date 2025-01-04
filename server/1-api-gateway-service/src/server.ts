import { CustomError, IErrorResponse, winstonLogger } from '@colson0x1/tradenexus-shared';
import { Application, json, NextFunction, Request, Response, urlencoded } from 'express';
import { Logger } from 'winston';
import cookieSession from 'cookie-session';
import cors from 'cors';
import hpp from 'hpp';
import helmet from 'helmet';
import compression from 'compression';
import { StatusCodes } from 'http-status-codes';

const SERVER_PORT = 4000;
const log: Logger = winstonLogger('', 'apiGatewatServer', 'debug');

// When we initialize this class, its going to take in an instance of express
export class GatewayServer {
  private app: Application;

  constructor(app: Application) {
    // Once we initialize this (GatewayServer class) i.e create an instance
    // of GatewayServer, then whatever we pass as the instance of express
    // into the GatewayServer, we're going to set it to `this.app` and then
    // `this.app` will be available throughout this class.
    this.app = app;
  }

  public start(): void {
    this.securityMiddleware(this.app);
    this.standardMiddleware(this.app);
    this.routesMiddleware(this.app);
    this.startElasticSearch();
    this.errorHandler(this.app);
  }

  private securityMiddleware(app: Application): void {
    // If we're using Express, then we need set this. Because if we don't
    // set this and once we deploy to production, some of our APIs, our APIs
    // might not even work at all.
    app.set('trust proxy', 1);
    // For the API gateway, im going to be store JWT token in the cookie
    // because saving it on the frontend perhaps saving it to local storage,
    // that's not a good approach.
    // So one way is, we can either save it on our cookie or we can create
    // a stroage store. Like maybe save it on MongoDB or we can save it on
    // Redis.
    // Here, in this application, im going to save JWT token, the authentication
    // token in a cookie! And then, once i deploy to production, im only going
    // to be accessing it via https.
    // So for local development, i will still be able to access it with http
    // but once I deploy, it has to be through https for security reasons!
    // @ Setting up the middleware that is going to use our cookie
    app.use(
      cookieSession({
        // name: 'tradenexus-session'
        name: 'session',
        // secret keys
        keys: [],
        // Token is valid for 7 days
        maxAge: 24 * 7 * 360000,
        // secure is very very important.
        // iF we set our cookie in the session and then we try to use http to
        // access it, we're going to get error. For local development its
        // fine with http. But once deployed to production, secure should be
        // set to true and then, if we use http protocol to access it, then
        // the API Gateway will be throwing errors.
        // So if secure it set to true, then the protocol must be https.
        secure: false // update with value from config
        // Also, once deployed to production, this sameSite should be
        // uncommented because Firefox and Chrome, they have a different
        // implementation of this `sameSite` property.
        // sameSite: none
      })
    );
    // hpp is a security module
    app.use(hpp());
    app.use(helmet());
    // cors will allow our client and our api gateway to communicate because
    // they are going to be on different origins. so it will allow them to
    // communicate
    app.use(
      cors({
        // origin is going to be client
        origin: '',
        // set credentials to true so that we can attach our token to every
        // request coming from the client
        credentials: true,
        // set the HTTP methods that will be used
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      })
    );
  }

  // @ middleware with the compressed JSON URL encoded
  private standardMiddleware(app: Application): void {
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
  }

  private routesMiddleware(app: Application): void {}

  private startElasticSearch(): void {}

  private errorHandler(app: Application): void {
    // Check if maybe there is a request or a URL that doesn't exist and its
    // used to send a request, then we need to catch that error
    // So what this means is, if the user tries to use an endpoint that
    // doesn't exist that is not defined in the server, then its going to
    // throw an error right here
    app.use('*', (req: Request, res: Response, next: NextFunction) => {
      // But this is going to be a very unlikely scenario whereby the user
      // will want to make a request with a URL that doesn't exist.
      // Probably i'll only use this when developing to check endpoint that
      // does not exist but once i go to production, this will be very difficult
      // @ constructing a URL from a request
      const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      log.log('error', `${fullUrl} endpoint does not exist.`, '');
      // send it back to the user
      // This is going to be very unlikely once I moved to production except
      // if a engineer i.e me makes a mistake
      res.status(StatusCodes.NOT_FOUND).json({ message: 'The endpoint called does not exist.' });
      next();
    });

    // Check for CustomError
    app.use((error: IErrorResponse, _req: Request, res: Response, next: NextFunction) => {
      log.log('error', `GatewayService ${error.comingFrom}:`, error);
      // CustomError is the name of the abstract class and each of the error
      // class is extending from CustomError
      // If error object we get is of type CustomError i.e if the error instance
      // is of type CustomError, then
      if (error instanceof CustomError) {
        res.status(error.statusCode).json(error.serializeErrors());
      }
      res.status(StatusCodes.NOT_FOUND).json({ message: 'The endpoint called does not exist.' });
      next();
    });
  }
}
