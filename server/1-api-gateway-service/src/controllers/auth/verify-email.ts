import { authService } from '@gateway/services/api/auth.service';
import { AxiosResponse } from 'axios';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export class VerifyEmail {
  public async update(req: Request, res: Response): Promise<void> {
    // We don't need the complete body, we just need only the token here.
    // i.e `req.body.token`
    const response: AxiosResponse = await authService.verifyEmail(req.body.token);
    res.status(StatusCodes.OK).json({ message: response.data.message, user: response.data.user });
  }
}
