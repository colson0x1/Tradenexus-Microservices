// I can either use node redis or ioredish library.
// Im also going to set this Redis connection in API Gateway.

import { winstonLogger } from '@colson0x1/tradenexus-shared';
import { Logger } from 'winston';
import { config } from '@gig/config';
import { createClient } from 'redis';

// Here i just created the type and the type is whatever the type of this
// `createClient()` method is. createClient is coming from Redis. So whatever
// the type is, that is what im setting to this `RedisClient` type.
type RedisClient = ReturnType<typeof createClient>;
// Create logger to send logs to Elasticsearch
const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'gigRedisConnection', 'debug');
// Create the actual client that i want to use.
const client: RedisClient = createClient({ url: `${config.REDIS_HOST}` });

// `redisConnect` method is going to be asynchronous and its going to return
// void
const redisConnect = async (): Promise<void> => {
  try {
    await client.connect();
    // Here i want to ping so whatever the ping is going to return, i want to
    // display here.
    // So if the connection is successful, we should be able to see a message
    // with GigService Redis Connection and then whatever this ping is oging to
    // return. Its usually a string and its called pong.
    log.info(`GigService Redis Connection: ${await client.ping()}`);
    // So if there's an error, i use the `cacheError` here
    cacheError();
  } catch (error) {
    log.log('error', 'GigService redisConnect() method error:', error);
  }
};

// Handle the case if there's an error
const cacheError = (): void => {
  // Here im listening for any `error` event. So if there's an error event, i
  // pass the error type of unknown. And then log the error inside of it.
  client.on('error', (error: unknown) => {
    log.error(error);
  });
};

export { redisConnect, client };
