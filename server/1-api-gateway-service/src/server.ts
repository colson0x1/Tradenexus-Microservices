import { winstonLogger } from '@colson0x1/tradenexus-shared';
import { Application } from 'express';
import { Logger } from 'winston';
import cookieSession from 'cookie-session';
import cors from 'cors';
import hpp from 'hpp';
import helmet from 'helmet';

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

  public start(): void {}

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
}
