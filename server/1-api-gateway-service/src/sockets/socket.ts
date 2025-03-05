/* import { winstonLogger } from '@colson0x1/tradenexus-shared';
import { Logger } from 'winston';
import { config } from '@gateway/config'; */
import { GatewayCache } from '@gateway/redis/gateway.cache';
import { Server, Socket } from 'socket.io';

/* const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'gatewaySocket', 'debug'); */

export class SocketIOAppHandler {
  private io: Server;
  private gatewayCache: GatewayCache;

  // Create constructor so that i can initialize the values
  constructor(io: Server) {
    this.io = io;
    // So im creating an instance of GatewayCache
    this.gatewayCache = new GatewayCache();
  }

  public listen(): void {
    this.io.on('connection', async (socket: Socket) => {
      // The first thing i want to do is, use this `getLoggedInUsersFromCache`
      // from gateway.cache.ts. For that, im going to listen for an event
      // coming from the Frontend. So the event will come from the fontend.
      // Im going to send the event with Socket.IO client from React application.
      // So im going to send this event `getLoggedInUsers` from the frontend so
      // i listen for the events here, and inside this callback below, i call
      // the `getLoggedInUsersFromCache` method. And then once i get back the
      // response, im going to send it back to the frontend.
      // So im listening for event from the frontend, and then get the data
      // from Redis and then emit it back to the frontend. So on the frontend,
      // im going to listen for an `online` event.
      // So this is how im going to get the logged in user data.
      socket.on('getLoggedInUsers', async () => {
        // And then inside this, once i listen for this event, im going to use
        // it to get the logged in users from the cache.
        // Here im passing the key `loggedInUsers`. it can be anything.
        const response: string[] = await this.gatewayCache.getLoggedInUsersFromCache('loggedInUsers');
        // Once i get the response, i'll send it back to the frontend.
        this.io.emit('online', response);
      });

      // Listening for another event called `loggedInUsers`. So once i listen for
      // this event, im going to call this method `saveLoggedInUserToCache` to
      // save the username.
      socket.on('loggedInUsers', async (username: string) => {
        // `saveLoggedInUserToCache` is going to need a key and a value. The
        // key, im going to call it `loggedInUsers` and the value is going to be
        // the username.
        const response: string[] = await this.gatewayCache.saveLoggedInUserToCache('loggedInUsers', username);
        this.io.emit('online', response);
      });

      // Another event to remove if a user is logged out.
      socket.on('removeLoggedInUser', async (username: string) => {
        const response: string[] = await this.gatewayCache.removeLoggedInUserFromCache('loggedInUsers', username);
        // So when i get the new response, i send it back to the frontend.
        this.io.emit('online', response);
      });

      // Anytime user clicks on a particular gig to view the complete information,
      // im going to emit this event `category` from frontend.
      // So here im passing category of type string and the user that is sending
      // this.
      socket.on('category', async (category: string, username: string) => {
        // Its coming from from gateway cache but i dont need to return any result.
        await this.gatewayCache.saveUserSelectedCategory(`selectedCategories:${username}`, category);
      });
    });
  }
}
