import { winstonLogger } from '@colson0x1/tradenexus-shared';
import { createClient } from 'redis';
import { Logger } from 'winston';
import { config } from '@gateway/config';

type RedisClient = ReturnType<typeof createClient>;
const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'gatewayCache', 'debug');

export class GatewayCache {
  client: RedisClient;

  constructor() {
    this.client = createClient({ url: `${config.REDIS_HOST}` });
  }

  /* @ Im going to use these methods: saveUserSelectedCategory, saveLoggedInUserToCache,
   * getLoggedInUsersFromCache, and removeLoggedInUserFromCache with Socket.IO
   * so that when the data comes from the frontend, im not going to send it to
   * any other service. They will be handled in the API gateway.
   * */

  /* @ Method that will be used to save the User selected category.
   * In the Gigs Service, i've the method to get the user category from Redis.
   * Here i'll be using set method.
   * */
  // So everytime a user selects a new category for a particular gig, then im
  // going to always replace whatever i have in the value field with the new value.
  // That is what im going to do with this `saveUserSelectedCategory` method.
  public async saveUserSelectedCategory(key: string, value: string): Promise<void> {
    try {
      // Check if the client connection is not opened, then i want to connect.
      // So create the connection.
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      // But if its already opened
      // Here im using `SET` method because im dealing with texts
      await this.client.SET(key, value);
    } catch (error) {
      log.log('error', 'GatewayService Cache saveUserSelectedCategory() method error:', error);
    }
  }

  /* Method to save the username of every logged in user. So if a user logs in,
   * im going to send the data to the API gateway via Socket.io, and that username,
   * im going to add it into an array save it to Redis. And then if the user
   * logs out, im going to remove that username.
   * */
  public async saveLoggedInUserToCache(key: string, value: string): Promise<string[]> {
    // So what is going to happen is, as the user logs in, im going to send the
    // username of that particular user. I send it to the the API gateway. And
    // then from the API gateway, i'll save it to the array that contains all
    // the names of the logged in users.
    try {
      // Check if the client connection is not opened, then i want to connect.
      // So create the connection.
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      // I will first of all, check, if whatever value or whatever username is
      // being sent. So i want to check if it already exists. So i need to get
      // the index.
      // LPOS because im going to push each username into an array. And then,
      // in order to check if the username already exists in the array, i first
      // need to get the index and i can get it with `LPOS` method. It takes in
      // the key and the value.
      // i.e LPOS is used to check for the position of an item inside an array.
      const index: number | null = await this.client.LPOS(key, value);
      if (index === null) {
        // If index equals null, that means the user has not been added.
        // i.e LPUSH can be used to left push into an array.
        await this.client.LPUSH(key, value);
        // log.info(`User ${value} added`)
        log.info(`User ${value} added to the list of logged in users`);
      }
      // To get all the elements inside an array in Redis, i can use LRANGE.
      // 0, -1 indicates that i want to get all the items. But if we want to get
      // the specific items like the first five items, then its 0, 4. So this will
      // return the items in the list.
      const response: string[] = (await this.client.LRANGE(key, 0, -1)) as string[];
      return response;
    } catch (error) {
      log.log('error', 'GatewayService Cache saveLoggedInUserToCache() method error:', error);
      return [];
    }
  }

  /* Method to get all the logged in users from the cache */
  public async getLoggedInUsersFromCache(key: string): Promise<string[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      // Get all the users in the cache for the particular key.
      const response: string[] = (await this.client.LRANGE(key, 0, -1)) as string[];
      return response;
    } catch (error) {
      log.log('error', 'GatewayService Cache getLoggedInUsersFromCache() method error:', error);
      return [];
    }
  }

  /* Method to remove the user from the cache. So if the user logs out, then I
   * want to remove the user.
   * */
  public async removeLoggedInUserFromCache(key: string, value: string): Promise<string[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      // Use LREM to remove a item from a list.
      // Here for LREM, i pass the key, the count and the value.
      await this.client.LREM(key, 0, value);
      // log.info(`User ${value} removed`)
      log.info(`User ${value} removed from the list of logged in users`);
      // And then i fetch the new array so that, i get the response right here.
      const response: string[] = (await this.client.LRANGE(key, 0, -1)) as string[];
      return response;
    } catch (error) {
      log.log('error', 'GatewayService Cache removeLoggedInUserFromCache() method error:', error);
      return [];
    }
  }
}
