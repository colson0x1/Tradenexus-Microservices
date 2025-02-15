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
import {
  updateSellerCancelledJobsProp,
  updateSellerCompletedJobsProp,
  updateSellerOngoingJobsProp,
  updateTotalGigsCount
} from '@users/services/seller.service';

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
      channel.ack(msg!);
    });
  } catch (error) {
    log.log('error', 'UsersService UserConsumer consumeBuyerDirectMessage() method error:', error);
  }
};
// Once i call this consume message in server, then if we create a new user
// from the Auth service, it will always create the buyer.

/* @ consumeSellerDirectMessage */
// This method will listen for messages from the Order Service. And the
// messages will be used to create, approve or delete orders inside the user's
// document or the seller's document. So the messages will come from Order service.
const consumeSellerDirectMessage = async (channel: Channel): Promise<void> => {
  // This fn will from Orders Service
  try {
    if (!channel) {
      channel = (await createConnection()) as Channel;
    }
    const exchangeName = 'tradenexus-seller-udpate';
    const routingKey = 'user-seller';
    const queueName = 'user-seller-queue';
    await channel.assertExchange(exchangeName, 'direct');
    const tradenexusQueue: Replies.AssertQueue = await channel.assertQueue(queueName, { durable: true, autoDelete: false });
    await channel.bindQueue(tradenexusQueue.queue, exchangeName, routingKey);
    // consume the message
    channel.consume(tradenexusQueue.queue, async (msg: ConsumeMessage | null) => {
      // These destructured properties are the properties that will be sent
      // from the Orders Service
      const { type, sellerId, ongoingJobs, completedJobs, totalEarnings, recentDelivery, gigSellerId, count } = JSON.parse(
        msg!.content.toString()
      );
      // So if the message comes from the Orders Service where the user is
      // creating an order
      // Because when the seller creates an order i.e pays for a particular gig,
      // and then there's a button that will be used to start the order. So
      // once they click that button, its going to create the order in the
      // Order service and send it to the Order database. And then, i want to
      // publish a message from the Order Service. And its going to have this
      // type called `create-order`
      // So once i have this type `create-order`, what i need to do is to just
      // update the ongoing jobs i.e i want to call this particular funtion
      // `updateSellerOngoingJobsProp` located at `users/src/services/seller.service.ts`
      // because I need to update this `ongoingJobs` property located at
      // `users/src/models/seller.schema.ts`
      if (type === 'create-order') {
        // So if type is equal to `create-order`, i want to update `ongoingJobs`
        // property.
        // That means, if the user has started working on a particular order,
        // then i want to update/increment the `ongoingJobs` property by `1`.
        await updateSellerOngoingJobsProp(sellerId, ongoingJobs);
      } else if (type === 'approve-order') {
        // if type is equal to `approve-order`, i want to update `completedJobs`
        // field located inside `users/src/models/seller.schema.ts`
        // The method thats going to use of that seller.schema.ts is
        // `updateSellerCompletedJobsProps` located inside `users/src/services/seller.service.ts`
        // and it takes data which is an object of type `IOrderMessage`
        await updateSellerCompletedJobsProp({
          sellerId,
          ongoingJobs,
          completedJobs,
          totalEarnings,
          recentDelivery
        });
      } else if (type === 'update-gig-count') {
        // So i want to update `totalGigs` field so if a seller creates a gig
        // for the first time, i want to update this `totalGigs`  property.
        // So i increment it by `1`.
        await updateTotalGigsCount(`${gigSellerId}`, count);
      } else if (type === 'cancel-order') {
        // So if a seller cancels an order, i want to decrement this by 1.
        // So i want to reduce the number of ongoing gigs. So i reduce this
        // value.
        await updateSellerCancelledJobsProp(sellerId);
      }
      channel.ack(msg!);
    });
  } catch (error) {
    log.log('error', 'UsersService UserConsumer consumeBuyerDirectMessage() method error:', error);
  }
};

export { consumeBuyerDirectMessage, consumeSellerDirectMessage };
