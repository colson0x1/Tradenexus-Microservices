import { authService } from '@gateway/services/api/auth.service';
import { AxiosResponse } from 'axios';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

/* const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'gatewaySignup', 'debug'); */

export class SignUp {
  public async create(req: Request, res: Response): Promise<void> {
    try {
      /* log.info('Gateway signup controller - start'); */
      /* log.info('Request body:', req.body); */

      // Here, ,`req.body` is coming from the frontend and we pass it into this
      // `signUp` function which is defined in gatway api/auth.service.ts and
      // then, this function `signUp` will send the request to the auth service.
      const response: AxiosResponse = await authService.signUp(req.body);
      /* log.info('Gateway signup controller - Received response from auth service'); */

      // Now set the JWT token in the sesion
      // We want to save the token in the cookie session from our API gateway.
      // Also from auth service controllers/signup.ts, at the end, we can see
      // there that we're sending the user object and the token. So that is the
      // token, we want to use to set the session inside the API gateway.
      // So here, im creating an object with jwt property and setting the token
      // In axios, our response is always inside a `data` object. So the token we
      // need is inside the data object. So with this, now this object with jwt
      // property will be added to `req.session` as the JWT token.
      req.session = { jwt: response.data.token };
      // Send whatever response we want to the frontend
      // Here, the `response.data.message` and `response.data.user`, we're getting
      // it from auth service, controllers/signup.ts response
      res.status(StatusCodes.CREATED).json({ message: response.data.message, user: response.data.user });
      /* log.info('Gateway signup controller - complete'); */
    } catch (error) {
      /* log.error('Gateway signup controller error:', error); */
      res.status(500).json('Internal server error');
    }
  }
}
