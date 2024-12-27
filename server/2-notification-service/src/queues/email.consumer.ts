import { config } from '@notifications/config';
import { IEmailLocals, winstonLogger } from '@colson0x1/tradenexus-shared';
import { Channel, ConsumeMessage } from 'amqplib';
import { Logger } from 'winston';
import { createConnection } from '@notifications/queues/connection';
import { sendEmail } from '@notifications/queues/mail.transport';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'emailConsumer', 'debug');

// Consume message from Auth service
async function consumeAuthEmailMessages(channel: Channel): Promise<void> {
  try {
    if (!channel) {
      channel = (await createConnection()) as Channel;
    }

    const exchangeName = 'tradenexus-email-notification';
    const routingKey = 'auth-email';
    const queueName = 'auth-email-queue';
    // Queue name is bound to the Exchange via the routing key
    // i.e anytime we publish the message with x (tradenexus-email-notification)
    // exchange name and y routing key (auth-email), the message will always go
    // to this z queue (auth-email-queue) because x and z are bound by y!
    // And then every consumer attached to this queue z will get that message.

    // Check queue at the exchange 'tradenexus-email-notification' exchange exists
    // i.e Send a direct message from the exchange to the queue using this
    // 'auth-email' routing key
    await channel.assertExchange(exchangeName, 'direct');
    // Also assert the queue i.e check if queue exists
    // Durable true means if the queue restarts, we want the message to persist.
    // autoDelete false means we only want to delete message from queue once
    // we acknolwedge them.
    const tradenexusQueue = await channel.assertQueue(queueName, { durable: true, autoDelete: false });
    // Bind the queue
    // bindQueue creates the routing paths between the exchange and the queue
    // via the routing key
    await channel.bindQueue(tradenexusQueue.queue, exchangeName, routingKey);
    // Consume the message
    channel.consume(tradenexusQueue.queue, async (msg: ConsumeMessage | null) => {
      // Message will be sent as either 'buffers' or as 'strings'
      // If its a string, we need to pass the data using JSON.parse()
      /* console.log(JSON.parse(msg!.content.toString())); */
      const { receiverEmail, username, verifyLink, resetLink, template } = JSON.parse(msg!.content.toString());
      // `locals` are just properties that we want to display in our templates
      const locals: IEmailLocals = {
        appLink: `${config.CLIENT_URL}`,
        appIcon: 'https://i.ibb.co/Y8NDWmV/tradenexus.png',
        username,
        verifyLink,
        resetLink
      };

      // Here im not adding acknowledge because if we send any message, we
      // want to see it in the queue before we acknowledge them.
      // @ Send emails
      await sendEmail(template, receiverEmail, locals);
      // @ Acknowledge
      channel.ack(msg!);
    });
  } catch (error) {
    log.error('error', 'NotificationService EmailConsumer consumeAuthEmailMessages() method error:', error);
  }
}

async function consumeOrderEmailMessages(channel: Channel): Promise<void> {
  try {
    if (!channel) {
      channel = (await createConnection()) as Channel;
    }

    // This is the exchange that will consume message related to Orders
    // The only message that will be sent from the chat service will be
    // when the seller sends an offer to the buyer
    const exchangeName = 'tradenexus-order-notification';
    const routingKey = 'order-email';
    const queueName = 'order-email-queue';

    await channel.assertExchange(exchangeName, 'direct');
    const tradenexusQueue = await channel.assertQueue(queueName, { durable: true, autoDelete: false });
    await channel.bindQueue(tradenexusQueue.queue, exchangeName, routingKey);
    channel.consume(tradenexusQueue.queue, async (msg: ConsumeMessage | null) => {
      console.log(JSON.parse(msg!.content.toString()));
      channel.ack(msg!);
      // @ Send emails
      // @ Acknowledge
    });
  } catch (error) {
    log.error('error', 'NotificationService EmailConsumer consumeOrderEmailMessages() method error:', error);
  }
}
export { consumeAuthEmailMessages, consumeOrderEmailMessages };
