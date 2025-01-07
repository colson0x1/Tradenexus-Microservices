import { config } from '@auth/config';
import { winstonLogger } from '@colson0x1/tradenexus-shared';
import client, { Channel, Connection } from 'amqplib';
import { Logger } from 'winston';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authQueueConnection', 'debug');

// This function returns a Promise of type undefined if there's an error in the
// connection or Promise of type Channel if the connection is successful.
async function createConnection(): Promise<Channel | undefined> {
  try {
    // Create the connection
    const connection: Connection = await client.connect(`${config.RABBITMQ_ENDPOINT}`);
    // With the conenction, we create our channel
    const channel: Channel = await connection.createChannel();
    log.info('Auth server connected to queue successfully...');
    closeConnection(channel, connection);
    return channel;
  } catch (error) {
    log.log('error', 'AuthService createConnection() method error:', error);
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
