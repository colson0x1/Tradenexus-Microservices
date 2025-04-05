import { config } from '@notifications/config';
import { winstonLogger } from '@colson0x1/tradenexus-shared';
import client, { Channel, Connection, Options } from 'amqplib';
import { Logger } from 'winston';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'notificationQueueConnection', 'debug');

// Helper function to add delay
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// @ Retry logic with exponential backoff.
// This function returns a Promise of type undefined if there's an error in the
// connection or Promise of type Channel if the connection is successful.
async function createConnection(): Promise<Channel | undefined> {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      log.info(`Attempting to connect to RabbitMQ at: ${config.RABBITMQ_ENDPOINT} (Attempt ${retries + 1}/${maxRetries})`);

      const connectionOptions: Options.Connect = {
        frameMax: 8192,
        heartbeat: 60
      };

      // Create the connection with the connection options
      const connection: Connection = await client.connect(`${config.RABBITMQ_ENDPOINT}`, connectionOptions);

      // With the connection, we create our channel
      const channel: Channel = await connection.createChannel();
      log.info('Notification server connected to queue successfully...');
      closeConnection(channel, connection);
      return channel;
    } catch (error) {
      retries++;
      log.log('error', `NotificationService createConnection() method (Attempt ${retries}/${maxRetries}):`, error);

      if (retries >= maxRetries) {
        log.error(`Failed to connect to RabbitMQ after ${maxRetries} attempts`);
        return undefined;
      }

      // Exponential backoff: wait longer between each retry
      const delay = Math.min(1000 * Math.pow(2, retries), 10000);
      log.info(`Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  return undefined;
}

// Graceful Shutdown
function closeConnection(channel: Channel, connection: Connection): void {
  process.once('SIGINT', async () => {
    await channel.close();
    await connection.close();
  });
}

export { createConnection };

/*
import { config } from '@notifications/config';
import { winstonLogger } from '@colson0x1/tradenexus-shared';
import client, { Channel, Connection, Options } from 'amqplib';
import { Logger } from 'winston';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'notificationQueueConnection', 'debug');

// This function returns a Promise of type undefined if there's an error in the
// connection or Promise of type Channel if the connection is successful.
async function createConnection(): Promise<Channel | undefined> {
  try {
    // Defining connection options with proper frameMax value
    const connectOptions: Options.Connect = {
      // Setting frameMax to at least 8192 as required by RabbitMQ
      frameMax: 8192
    };
    // Create the connection
    const connection: Connection = await client.connect(`${config.RABBITMQ_ENDPOINT}`, connectOptions);
    // With the conenction, we create our channel
    const channel: Channel = await connection.createChannel();
    log.info('Notification server connected to queue successfully...');
    closeConnection(channel, connection);
    return channel;
  } catch (error) {
    log.log('error', 'NotificationService createConnection() method:', error);
    return undefined;
  }
}

// Graceful Shutdown
// If there's an issue then we want to close the channel and then close the
// connection.
function closeConnection(channel: Channel, connection: Connection): void {
  process.once('SIGINT', async () => {
    await channel.close();
    await connection.close();
  });
}

export { createConnection };
*/
