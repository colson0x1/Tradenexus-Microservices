import { authService } from '@gateway/services/api/auth.service';
import { AxiosResponse } from 'axios';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export class Refresh {
  public async token(req: Request, res: Response): Promise<void> {
    const response: AxiosResponse = await authService.getRefreshToken(req.params.username);
    // If the user is logging in, we set the session as well
    // i.e token that is returned, we're adding to the session. So we add the
    // new token to the session!
    req.session = { jwt: response.data.token };
    res.status(StatusCodes.OK).json({ message: response.data.message, user: response.data.user });
  }
}
