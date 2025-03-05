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
import { elasticSearch } from '@gateway/elasticsearch';
import { appRoutes } from '@gateway/routes';
import { axiosAuthInstance } from '@gateway/services/api/auth.service';
import { axiosBuyerInstance } from '@gateway/services/api/buyer.service';
import { axiosSellerInstance } from '@gateway/services/api/seller.service';
import { axiosGigInstance } from '@gateway/services/api/gig.service';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { SocketIOAppHandler } from '@gateway/sockets/socket';

const SERVER_PORT = 4000;
const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'apiGatewayServer', 'debug');
export let socketIO: Server;

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
    // The purpose of this middleware is to add the bearer token. So when the
    // request comes from the frontend and then before the API gateway sends the
    // request to the respective service, lets say auth service, its going to
    // add the bearer token to the headers.
    // So in nutshell, whats going to happen here is, before Axios makes a
    // request to the authentication service, its going to check if the
    // `req.session?.jwt` exists. If it does, then add it as a bearer token. Add
    // it to the authorization headers.
    // And in the auth service server.ts, on the line:
    // `const payload: IAuthPayload = verify(token, config.JWT_TOKEN!) as IAuthPayload`
    // That is where im checking to verify the token. So when the request comes,
    // we're still going to verify that it's a valid token using that `verify()`.
    // If its not a valid token, we throw an error. We reject the request. If
    // its a valid token, we allow the request to proceed.
    app.use((req: Request, _res: Response, next: NextFunction) => {
      if (req.session?.jwt) {
        // Now we want to append the token to this axios instance i.e
        // axiosAuthInstance in api/auth.service.ts
        // Here, if we want to use axios to maybe update dynamically or add
        // the property to the headers dynamically, this is how we do it.
        // i.e `axiosAuthInstance.defaults.headers`
        // and then what we want to update is 'Authorization' header.
        // So here we're adding bearer token to the authorization header
        // for auth axios instance
        axiosAuthInstance.defaults.headers['Authorization'] = `Bearer ${req.session?.jwt}`;
        axiosBuyerInstance.defaults.headers['Authorization'] = `Bearer ${req.session?.jwt}`;
        axiosSellerInstance.defaults.headers['Authorization'] = `Bearer ${req.session?.jwt}`;
        axiosGigInstance.defaults.headers['Authorization'] = `Bearer ${req.session?.jwt}`;
      }
      next();
    });
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

  private routesMiddleware(app: Application): void {
    appRoutes(app);
  }

  private startElasticSearch(): void {
    elasticSearch.checkConnection();
  }

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

  /* @ Socket.IO
   * Socket io will be used as a bidirectional tool to send data from the client
   * to API gateway, from API gateway back to the client, or from API gateway to
   * one or more services.
   * Im going to use socket.io `redis-adapter` because once i deploy to production,
   * im going to be running with PM2 and im going to be running at least 5 processes.
   * If I dont setup with Redis adapter, then if there's a connection on one that is
   * established when probably a particular communication is on a particular process,
   * and then if that process dies, then that communication as well will die. But
   * setting up with Redis adapter, i can run multiple instances in different
   * processes. So i can use it because if i dont use Redis adapter, its going
   * to be one instance to one process.
   * So by running Socket.IO with the `@socket.io/redis-adapter` adapter, i can run
   * multiple Socket.IO instances in different processes or servers that can all
   * broadcast and emit events to and from each other.
   * */
  // Here, this `Server` that is returning, its from the Socket.IO server but
  // its going to take in the http server.
  private async createSocketIO(httpServer: http.Server): Promise<Server> {
    // Create an instance of Socket.IO server. So this is an instance of the
    // new Socket.IO server.
    const io: Server = new Server(httpServer, {
      cors: {
        origin: config.CLIENT_URL,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      }
    });
    // Now create client using socket.io redis adapter.
    const pubClient = createClient({ url: config.REDIS_HOST });
    // Im creating subscribe client by calling `duplicate` method on publish client.
    const subClient = pubClient.duplicate();
    // Using it
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    // Setting up the socketIO value that im exporting above
    // So that socketIO equals to the io instance i created just right above
    socketIO = io;
    return io;
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
      // Using the method
      const socketIO: Server = await this.createSocketIO(httpServer);
      this.startHttpServer(httpServer);
      this.socketIOConnections(socketIO);
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

  /* Method that defines Socket.IO connection instance */
  private socketIOConnections(io: Server): void {
    const socketIoApp = new SocketIOAppHandler(io);
    socketIoApp.listen();
  }
}
