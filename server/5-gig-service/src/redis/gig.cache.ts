/* @ Redis Architecture */
// I want to create the fn that im giong to use to get data from Redis.
// Im only going to have one function which is just a sijmple GET to get
// categories from Redis. The reason why im going to add those categoes is
// simple.
// On the client, on the frontend, if a user clicks on a particular gig, i want
// to save that gig's category. So whatever the category of that particular
// gig belongs to, im going to get that category name and then save it to Redis.
// And then, i can use that gig or that category name to fetch data based on the
// category and then display it on the frontend.
// So, for example, the user on the forntend clicks on this particular gig
// and the gig category name is music & audio. Now im going to save that value
// in Redis. And on then front page, if the user goes back to the home page,
// im going to fetch maybe five documents or five gigs from Elasticsearch that
// has this same `music & audio` category. That is just what i want to do.
// But everytime the user goes to a different category, i will always be
// updating the categories value and the Redis cache. So im not going to store
// the categories as a list. im just going to set it as a vlaue. So any time
// user clicks on a category, lets say music and audio, and then they go
// back to the index page, im going to use this category value to fetch gigs,
// maybe 5 gigs or 10 gigs that matches this category. And then if the user clicks,
// on a different gig, lets say another gig with category writing & translation,
// then im going to replace the previous one in the Redis cache with this new
// value. So the new value is going to be writing and translation. And then if the
// user goes back to the home oage, i get gigs with this particular category.
// That is how im going to perform queries. That is how im going to use it.
// Now the method that i add, the actual categotries to Redis, im not adding it
// in the Gig Service. Im going to add it in API Gateway. From the API gateway,
// im going to add the methods that will save the categories to Redis and some
// other methods that will add some other data to Redis. Im going to do it
// in the API Gateway Service.

import { winstonLogger } from '@colson0x1/tradenexus-shared';
import { Logger } from 'winston';
import { config } from '@gig/config';
import { client } from '@gig/redis/redis.connection';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'gigCache', 'debug');

/* @ Method to fetch the category
 * So this method here will just be used to fetch the category. The method to
 * add the categories to Redis Cache, im going to add it from API Gateway Service
 * and then i get the data. So data will be added to Redis Cache which will be
 * done through API Gateway Service. And the otehr Services will just connect to
 * that Redis instance and then get the data that they want.
 * */
// So every gig that a user clicks, im going to save the category of that gig
// to Redis.
// So the value for the categories, each user will have just one category
// at a time. And that category is giong to be a string.
const getUserSelectedGigCategory = async (key: string): Promise<string> => {
  try {
    // Check if client connection is open. if it is false, that means there
    // is no connection that im trying to connect again
    // `isOpen` is a boolean
    // NOTE: With Redis, i have to create connection wherever i need it.
    // So here, im checking if the connection is open. If its not open, then
    // create the connection.
    if (!client.isOpen) {
      // create connection
      await client.connect();
    }
    // Saving category name as a string. Here im using this `GET` method to
    // get the string that i saved.
    const response: string = (await client.GET(key)) as string;
    return response;
  } catch (error) {
    log.log('error', 'GigService GigCache getUserSelectedGigCategory() method error:', error);
    return '';
  }
};

export { getUserSelectedGigCategory };
