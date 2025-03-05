import { GatewayCache } from '@gateway/redis/gateway.cache';
import { socketIO } from '@gateway/server';
import { authService } from '@gateway/services/api/auth.service';
import { AxiosResponse } from 'axios';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

// Initialize an instance of Gateway Cache
const gatewayCache: GatewayCache = new GatewayCache();

export class CurrentUser {
  public async read(_req: Request, res: Response): Promise<void> {
    const response: AxiosResponse = await authService.getCurrentUser();
    res.status(StatusCodes.OK).json({ message: response.data.message, user: response.data.user });
  }

  public async resendEmail(req: Request, res: Response): Promise<void> {
    const response: AxiosResponse = await authService.resendEmail(req.body);
    res.status(StatusCodes.OK).json({ message: response.data.message, user: response.data.user });
  }

  // Im going to add more methods here and the method is going to be called
  // via API endpoints and they'll be used to retrieve logged in users and then
  // remove logged in users as well.

  public async getLoggedInUsers(_req: Request, res: Response): Promise<void> {
    // The key `loggedInUsers` comes from gateway/src/sockets/socket.ts.
    const response: string[] = await gatewayCache.getLoggedInUsersFromCache('loggedInUsers');
    // Use socketIO instance that is exported form the server file
    socketIO.emit('online', response);
    // So when a particular user logs in, im going to make a request via the
    // endpoint to call this `getLoggedInUsers` method and then i get all the
    // users. So the users will be added and then i get all the users that are
    // already logged in that are saved in the cache.
    res.status(StatusCodes.OK).json({ message: 'User is online' });
  }

  public async removeLoggedInUser(req: Request, res: Response): Promise<void> {
    const response: string[] = await gatewayCache.removeLoggedInUserFromCache('loggedInUsers', req.params.username);
    socketIO.emit('online', response);
    res.status(StatusCodes.OK).json({ message: 'User is offline' });
  }
}
