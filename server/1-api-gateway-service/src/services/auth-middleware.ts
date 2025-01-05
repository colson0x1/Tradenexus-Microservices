import { config } from '@gateway/config';
import { BadRequestError, IAuthPayload, NotAuthorizedError } from '@colson0x1/tradenexus-shared';
import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';

class AuthMiddleware {
  public verifyUser(req: Request, _res: Response, next: NextFunction): void {
    // If the request is coming from the frontend and it doesnt has the
    // valid JWT token or no token at all, then reject the request
    // So if no `jwt` property is found in the `session`, throw an error
    if (!req.session?.jwt) {
      throw new NotAuthorizedError('Token is not available. Please login again', 'GatewayService verifyUser() method error');
    }

    // @ Implement JWT token verification
    // If token verification is successful, set the payload in the `currentUser`
    // object thats on the request. And then, payload will contain id, username,
    // email, and iat as specified on IAuthPayload on shared lib: auth.interface.ts
    try {
      // NOTE: `JWT_TOKEN` is responsible for authentication between client
      // i.e frontend and API Gateway and then `GATEWAY_JWT_TOKEN` is
      // responsible for request going from the API Gateway to microservices
      const payload: IAuthPayload = verify(req.session?.jwt, `${config.JWT_TOKEN}`) as IAuthPayload;
      // In shared library, there's `currentUser?` of type `IAuthPayload` to
      // the Request namespace inside auth.interface.ts, so here we're setting
      // it
      // So if we have a payload, then
      req.currentUser = payload;
    } catch (error) {
      // If in the process of verifying token, the token is either invalid or
      // maybe the token has expired, then throw error
      throw new NotAuthorizedError(
        'Token is not available. Please login again',
        'GatewayService verifyUser() method invalid session error'
      );
    }
    next();
  }

  // Check authentication i.e check if the user actually has this `currentUser`
  // i.e This `checkAuthentication` method will always be called if we want
  // to access a particular route. So here, we check if the request contains
  // this `currentUser` because on verifyUser method, `currentUser` is set.
  // But we still have to check if it contains the `currentUser` because
  // if `verifyUser` method fails, its not going to set any `currentUser` so
  // here, we need to check if the request contains the `currentUser`.
  // If it doesn't, we throw BadRequestError, but it it does, we allow the
  // request to proceed!
  public checkAuthentication(req: Request, _res: Response, next: NextFunction): void {
    if (!req.currentUser) {
      throw new BadRequestError('Authentication is required to access this route.', 'GatewayService checkAuthentication() method error');
    }
    next();
  }
}

export const authMiddleware: AuthMiddleware = new AuthMiddleware();
