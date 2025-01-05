import http from 'http';

import { CustomError, IErrorResponse, winstonLogger } from '@colson0x1/tradenexus-shared';
import { Application, json, NextFunction, Request, Response, urlencoded } from 'express';
import { Logger } from 'winston';
import cookieSession from 'cookie-session';
import cors from 'cors';
import hpp from 'hpp';
import helmet from 'helmet';
import compression from 'compression';
import { StatusCodes } from 'http-status-codes';
import { config } from '@gateway/config';

const SERVER_PORT = 4000;
const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'apiGatewayServer', 'debug');

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
    this.routesMiddleware();
    this.startElasticSearch();
    this.errorHandler(this.app);
    this.startServer(this.app);
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
        keys: [`${config.SECRET_KEY_ONE}`, `${config.SECRET_KEY_TWO}`],
        // Token is valid for 7 days
        maxAge: 24 * 7 * 360000,
        // secure is very very important.
        // iF we set our cookie in the session and then we try to use http to
        // access it, we're going to get error. For local development its
        // fine with http. But once deployed to production, secure should be
        // set to true and then, if we use http protocol to access it, then
        // the API Gateway will be throwing errors.
        // So if secure it set to true, then the protocol must be https.
        secure: config.NODE_ENV !== 'development'
        // Also, once deployed to production, this sameSite should be
        // uncommented because Firefox and Chrome, they have a different
        // implementation of this `sameSite` property.
        // sameSite: none
      })
    );
    // hpp is a security module.
    // hpp stands for HTTP parameter pollution it prevents hpp atacks in web
    // applications like if attackers try to inject multiple parameters with
    // the same name into HTTP request, aiming to confuse the server side
    // logic or bypass security checks, using hpp package ensures that any
    // repeated query string parameters are properly sanitized, usually by
    // preserving the first occurrence of each parameter and discarding the
    // subsequent ones. this helps preventing attackers from exploiting
    // such vulnerabilities
    app.use(hpp());
    //  helmet is a collection of middleware functions designed to help secure
    //  HTTP headers in a web application, primarily built with Node.js and
    //  Express.
    //  It sets various HTTP headers to protect against common security
    //  vulnerabilities, such as cross-site scripting (XSS), clickjacking,
    //  and other types of attacks that can exploit weaknesses in a web
    //  application.
    app.use(helmet());
    // cors will allow our client and our api gateway to communicate because
    // they are going to be on different origins. so it will allow them to
    // communicate
    app.use(
      cors({
        // origin is going to be client
        origin: config.CLIENT_URL,
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

  private routesMiddleware(): void {}

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

  private async startServer(app: Application): Promise<void> {
    try {
      // The reason why im not importing directly this server from http is
      // because there might be cases whereby, we have different library that
      // has server as an export, and then we might be in confusion. So,
      // http.Server will just let us know that this server is coming from
      // http. For example, we might set up Socket.io and Socket.io has its own
      // server export. If we get this i.e const httpServer: Server, if we do
      // it this way, i.e just importing server from http, it will conflict
      // with Socket.io own server export.
      const httpServer: http.Server = new http.Server(app);
      this.startHttpServer(httpServer);
    } catch (error) {
      log.log('error', 'GatewayService startServer() error method:', error);
    }
  }

  private async startHttpServer(httpServer: http.Server): Promise<void> {
    try {
      // log.info(`Worker with process id of ${process.pid} on gateway has started`)
      log.info(`Gateway server has started with process id ${process.pid}`);
      httpServer.listen(SERVER_PORT, () => {
        log.info(`Gateway server running on port ${SERVER_PORT}`);
      });
    } catch (error) {
      log.log('error', 'GatewayService startServer() error method:', error);
    }
  }
}
