import { config } from '@order/config';
import { winstonLogger } from '@colson0x1/tradenexus-shared';
import { Logger } from 'winston';
import { Channel, ConsumeMessage, Replies } from 'amqplib';
/* import { Channel, ConsumeMessage, Replies } from 'amqplib/callback_api'; */
import { createConnection } from '@order/queues/connection';
import { updateOrderReview } from '@order/services/order.service';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'orderServiceConsumer', 'debug');

export const consumerReviewFanoutMessages = async (channel: Channel): Promise<void> => {
  try {
    if (!channel) {
      /* channel = (await createConnection()) as Channel; */
      channel = (await createConnection()) as unknown as Channel;
    }

    const exchangeName = 'tradenexus-review';
    // For this exchange, i dont need a routing key for this exchange or for
    // this consumer.
    const queueName = 'order-review-queue';
    await channel.assertExchange(exchangeName, 'fanout');
    // If the queue does not exist, then create it.
    // Im setting the properties here so that if there is an issue with the queue,
    // maybe the queue restarted, i still want the messages that have not been
    // acknowledged to be still be available using this durable property.
    const tradenexusQueue: Replies.AssertQueue = await channel.assertQueue(queueName, { durable: true, autoDelete: false });
    // since im not using the routing key, so im setting it to an empty string.
    await channel.bindQueue(tradenexusQueue.queue, exchangeName, '');
    channel.consume(tradenexusQueue.queue, async (msg: ConsumeMessage | null) => {
      // console.log(JSON.parse(msg!.content.toString()));
      // So what i want to consume in this consume callback is, i want to call
      // this `updateOrderReview` method located in order.service.ts.
      // So whatever is returned from the content, im going to pass it in the
      // updateOrderReview method.
      await updateOrderReview(JSON.parse(msg!.content.toString()));
      // Then i need to acknowledge the message.
      // So if everything goes well, i acknowledge the message.
      channel.ack(msg!);
    });
  } catch (error) {
    log.log('error', 'OrderService consumer consumerReviewFanoutMessages() method error:', error);
  }
};
