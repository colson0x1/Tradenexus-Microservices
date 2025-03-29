// The review service can only send/publish events/messages. It does not
// receive/consume events/messages. i.e It will only publish events to the
// Users and Order Services but it will not consume any event.
// Im going to use the fanout so that whenever a message is published to
// an exchange, the exchange will send it to all other consumers that are
// connected to that particular queue. So in this case, i send one event.
// Then, it will be consumed by the Users Service and the Order Service.
// But in Order Service, i've used direct exchange so that exchange will send
// it directly to the queue and the queue will send it directly to the consumer.

import { config } from '@review/config';
import { winstonLogger } from '@colson0x1/tradenexus-shared';
import { Logger } from 'winston';
/* import { Channel } from 'amqplib'; */
import { Channel } from 'amqplib/callback_api';
import { createConnection } from '@review/queues/connection';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'reviewServiceProducer', 'debug');

const publishFanoutMessage = async (
  channel: Channel,
  exchangeName: string,
  // Fanout exchange doesnt need a routing key.
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
    await channel.assertExchange(exchangeName, 'fanout');
    // message is always going to be a Buffer
    // For routing key, im setting it to an empty string i.e empty routing key
    // since its a Fanout exchange.
    // So because this producer is sending an empty string as the routing key,
    // then in the consumer, i bind the queue with an empty string i.e in
    // Order Service -> order.consumer.ts -> consumerReviewFanoutMessages()
    // The exchange will automatically know which queues to bind. So that is why
    // i use there as an empty string i.e in order.consumer.ts and in this
    // producer review.producer.ts, im sending it as an empty string.
    channel.publish(exchangeName, '', Buffer.from(message));
    log.info(logMessage);
  } catch (error) {
    // In the process of doing everything inside `try` statement, if there's
    // an error, i log the error right here
    log.log('error', 'ReviewService publishFanoutMessage() method:', error);
  }
};

export { publishFanoutMessage };
