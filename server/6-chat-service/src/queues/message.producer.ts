import { config } from '@chat/config';
import { winstonLogger } from '@colson0x1/tradenexus-shared';
import { Logger } from 'winston';
import { Channel } from 'amqplib';
import { createConnection } from '@chat/queues/connection';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'chatServiceProducer', 'debug');

// Its going to use the direct exchange
// So what it means is once the exchange receives the messages from the producer,
// its going to send it directly to the queue.
const publishDirectMessage = async (
  channel: Channel,
  exchangeName: string,
  routingKey: string,
  message: string,
  logMessage: string
): Promise<void> => {
  try {
    if (!channel) {
      // If there's no channel, we create the connection and then it returns
      // the Channel
      channel = (await createConnection()) as Channel;
    }
    // Otherwise, we assert an exchange and then we publish a message
    await channel.assertExchange(exchangeName, 'direct');
    // message is always going to be a Buffer
    channel.publish(exchangeName, routingKey, Buffer.from(message));
    log.info(logMessage);
  } catch (error) {
    // In the process of doing everything inside `try` statement, if there's
    // an error, we log the error right here
    log.log('error', 'ChatService publishDirectMessage() method error:', error);
  }
};

export { publishDirectMessage };
