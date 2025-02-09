/* @ Consumer to consume the message sent from the Auth Service */
// In publishDirectMessage from auth/services/auth.service.ts
// So the message published from the Auth service when the user creates an
// account, that is the one i want to consume.

import { config } from '@users/config';
import { IBuyerDocument, winstonLogger } from '@colson0x1/tradenexus-shared';
import { Logger } from 'winston';
import { Channel, ConsumeMessage, Replies } from 'amqplib';
import { createConnection } from '@users/queues/connection';
import { createBuyer, updateBuyerPurchasedGigsProp } from '@users/services/buyer.service';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'usersServiceConsumer', 'debug');

// Method to consume the message that is published from the auth service
// with the exchange name `tradenexus-buyer-update` inside auth/services/auth.service.ts
const consumeBuyerDirectMessage = async (channel: Channel): Promise<void> => {
  try {
    if (!channel) {
      channel = (await createConnection()) as Channel;
    }
    // Set exchange name
    const exchangeName = 'tradenexus-buyer-udpate';
    // routingKey should be the same as in publisher
    const routingKey = 'user-buyer';
    // Create a name for the queue to indentify the queue
    // so any message that matches this exchangeName and routingKey will always
    // go to this queue i.e queueName
    const queueName = 'user-buyer-queue';
    // Assert the exchange
    // NOTE: the exchange type should match the same as its in producer
    // assertExchange makes sure that we've the same exchange coming from the
    // publisher
    await channel.assertExchange(exchangeName, 'direct');
    // This assertQueue will create the queue
    // So assertQueue will check if the queue already exists. If the queue
    // does not exist, it'll create the queue. so why im passing queueName
    // to make sure if the queue already exists or not. If it does not
    // exists, it creates it. Otherwise, it'll just return the queue object.
    const tradenexusQueue: Replies.AssertQueue = await channel.assertQueue(queueName, { durable: true, autoDelete: false });
    // Connect the `exchange` with the `queue` using the `routingKey`.
    // The method to achieve that is called `bindQueue`. bindQueue will create
    // a path, a routing path between the exchange and the queue.
    await channel.bindQueue(tradenexusQueue.queue, exchangeName, routingKey);
    // consume the message
    channel.consume(tradenexusQueue.queue, async (msg: ConsumeMessage | null) => {
      // Inside this message, once the queue has been consumed, then im going to
      // acknowledge it. If i dont acknowledge it, the message will just remain
      // in the queue.
      // This give us the actual item that im sending from Auth Service
      const { type } = JSON.parse(msg!.content.toString());
      // If type is 'auth', that means, the message came from the Auth Service
      if (type === 'auth') {
        // The reasons i didn't do this statement outside i.e above the if
        // statement is because the message might be coming from a different
        // service, and these properties might not exist. So i dont want it to
        // throw any error. so that is why i just destructured the `type` above
        // and the `type` is equal to `auth`. This means, inside this if statement,
        // we're very sure that, it'll contain these properties.
        const { username, email, profilePicture, country, createdAt } = JSON.parse(msg!.content.toString());
        // construct buyer document
        const buyer: IBuyerDocument = {
          username,
          email,
          profilePicture,
          country,
          purchasedGigs: [],
          createdAt
        };
        // create the buyer
        await createBuyer(buyer);
      } else {
        // Update the buyer document
        const { buyerId, purchasedGigs } = JSON.parse(msg!.content.toString());
        await updateBuyerPurchasedGigsProp(buyerId, purchasedGigs, type);
      }
    });
  } catch (error) {
    log.log('error', 'UsersService UserConsumer consumeBuyerDirectMessage() method error:', error);
  }
};

// Once i call this consume message in server, then if we create a new user
// from the Auth service, it will always create the buyer.

export { consumeBuyerDirectMessage };
