/* @ This is Publisher i.e publishDirectMessage()
 * Its what will be used to publish the messages from Auth Service
 **/
// For the producer, we need to use the channel from the createConnection
// and then we need to assert the exchange and then we need to publish.

import { winstonLogger } from '@colson0x1/tradenexus-shared';
import { config } from '@auth/config';
import { Logger } from 'winston';
import { Channel } from 'amqplib';
import { createConnection } from '@auth/queues/connection';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authServiceProducer', 'debug');

export async function publishDirectMessage(
  channel: Channel,
  exchangeName: string,
  routingKey: string,
  // message is going to be stringified. so even if its the object we want to
  // send, the object will always be stringified.
  // so object, boolean, array whatever, im going to convert it to string
  message: string,
  logMessage: string
): Promise<void> {
  try {
    // Check if this connection `channel` does not exist i.e  in connection.ts,
    // if there's an error with a process, both channel and connection will be
    // closed. So check if there is no channel, then create a new channel.
    if (!channel) {
      // Im type casting this as Channel because createConnection returns
      // Channel or undefined. So im telling it that i expect it to return a
      // channel.
      // So if no channel, then create a new connection and then return a
      // channel.
      channel = (await createConnection()) as Channel;
    }

    // Now the first thing we need to do for Producer is, we need to assert
    // the exchange
    // The email message that I want to send from the Auth Service to the
    // Notification Service will be 'direct' message. So for the verify email,
    // message is going to be a direct exchange.
    // Direct means, once the exchange receives the message from the publisher,
    // its going to send it directly via the routing key to the queue.
    await channel.assertExchange(exchangeName, 'direct');
    channel.publish(exchangeName, routingKey, Buffer.from(message));
    log.info(logMessage);
  } catch (error) {
    log.log('error', 'AuthService Provider publishDirectMessage() method error:', error);
  }
}
