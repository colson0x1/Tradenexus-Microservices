/* @ Consumer to consume the message sent from the Auth Service */
// In publishDirectMessage from auth/services/auth.service.ts
// So the message published from the Auth service when the user creates an
// account, that is the one i want to consume.

import { config } from '@users/config';
import { IBuyerDocument, ISellerDocument, winstonLogger } from '@colson0x1/tradenexus-shared';
import { Logger } from 'winston';
import { Channel, ConsumeMessage, Replies } from 'amqplib';
import { createConnection } from '@users/queues/connection';
import { createBuyer, updateBuyerPurchasedGigsProp } from '@users/services/buyer.service';
import {
  getRandomSellers,
  updateSellerCancelledJobsProp,
  updateSellerCompletedJobsProp,
  updateSellerOngoingJobsProp,
  updateSellerReview,
  updateTotalGigsCount
} from '@users/services/seller.service';
import { publishDirectMessage } from '@users/queues/user.producer';
import { parseInt } from 'lodash';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'usersServiceConsumer', 'debug');

// Method to consume the message that is published from the auth service
// with the exchange name `tradenexus-buyer-update` inside auth/services/auth.service.ts
const consumeBuyerDirectMessage = async (channel: Channel): Promise<void> => {
  try {
    if (!channel) {
      channel = (await createConnection()) as Channel;
    }
    // Set exchange name
    const exchangeName = 'tradenexus-buyer-update';
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
        /* console.log('USERS Service - queues/user.consumer.ts - ConsumeBuyerDirectMessage()'); */
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
    const exchangeName = 'tradenexus-seller-update';
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
    log.log('error', 'UsersService UserConsumer consumeSellerDirectMessage() method error:', error);
  }
};

/* @ consumeReviewFanoutMessages */
// This method will consume messages coming from the Review Service.
// So when or once a buyer adds a review, the review from the frontend will
// go to the API gateway, and from the API gateway, it'll go to the Review
// Service. So once the review is updated in the review service database,
// then im going to publish a message from the Review Service to the Users
// Service. And then in the Users Service, im going to consume that message.
// And once i consume the message and use the message, im going to publish
// a message from this service as well. So im going to publish a message
// from this Service (i.e Users Service) and send it to the Gig Service.
// So here i'll also be publishing another message once i consume the message.
// But now this, fn or this method, that i want to create the consumer, the
// exchange type is going to be different. Previously i've been using `direct`
// exchange. This time, im going to use the `fanout` exchange.
// So from the review service, once the message is  published, im going to
// use the `fanout`. And then every consumer listening to that to or connected
// to that to the queue with the same exchange name, then all messages will
// be sent to or consumed by those consumers. So im going to use a `fanout`.
const consumeReviewFanoutMessages = async (channel: Channel): Promise<void> => {
  try {
    if (!channel) {
      channel = (await createConnection()) as Channel;
    }
    // So from the Review Service, im going to call the exchange  name as
    // `tradenexus-review`
    const exchangeName = 'tradenexus-review';
    // For queueName, the queue name is going to be `seller-review-queue`
    // So the idea is, if a buyer adds a review for a particular gig, then i
    // want to also add that review i.e update the properties located in
    // `users/src/models/seller.schema.ts`
    // So i want to update these properties in the seller's object or the seller's
    // document. Properties like `ratingsCount`, `ratingSum`, `ratingCategories`
    // So here the queue name is going to be `seller-review-queue`
    const queueName = 'seller-review-queue';
    // For `fanout` exchange, we don't need a routing key! But for the `direct`,
    // routingKey is required. So here, im going to assert the exchange but
    // the exchange type is going to be fanout.
    // So what fanout means is, if a message is published and sent to the
    // exchange, and then every message or every consumer listening for
    // messages to a particular queue will receive that message. But if its the
    // direct, the exchange will send the messages directly to the queue and
    // the consumers will get it from the queue. But this time, every queue
    // or every consumer listening to the queues with this fanout exchange type,
    // they will receive the message.
    await channel.assertExchange(exchangeName, 'fanout');
    const tradenexusQueue: Replies.AssertQueue = await channel.assertQueue(queueName, { durable: true, autoDelete: false });
    // To bind the queue, i don't have a `routingKey` so an empty strings ''.
    // So im using this empty strings because im using a fanout. i dont need
    // a routing key.
    await channel.bindQueue(tradenexusQueue.queue, exchangeName, '');
    // consume the message
    channel.consume(tradenexusQueue.queue, async (msg: ConsumeMessage | null) => {
      // These destructured properties are the properties that will be sent
      // from the Review Service
      const { type } = JSON.parse(msg!.content.toString());
      // So here simply, once i get the fanout message fro the review service,
      // then i check if the type is equal to `buyer-review`, then i update the
      // seller's properties like `ratingsCount`, `ratingSum`, `ratingCategories`
      // and then i publish a message from this User service. So i sent it to
      // the Gigs service
      if (type === 'buyer-review') {
        // So when the message is coming from the Review Service, if the
        // type is `buyer-review`, then i want to update.
        await updateSellerReview(JSON.parse(msg!.content.toString()));
        // And then, once the update is done, i want to publish a message.
        // i.e now, the message i want to publish/send is to the Gig Service.
        // I could have probably sent it directly from the Review service to
        // the Gig service, but no, i don't want to do that. So instead, i
        // will just once update this part i.e `updateSellerReview`, then i
        // send it from here to the Gig service.
        // The exchange type for the message im going to publish is going to
        // be direct exchange.
        await publishDirectMessage(
          channel,
          // name of exchange
          'tradenexus-update-gig',
          // routing key
          'update-gig',
          // message i want to publish to the Gigs Service
          JSON.stringify({ type: 'updateGig', gigReview: msg!.content.toString() }),
          'Message sent to gig service.'
        );
      }

      channel.ack(msg!);
    });
  } catch (error) {
    log.log('error', 'UsersService UserConsumer consumeReviewFanoutMessages() method error:', error);
  }
};

/* @ consumeSeedGigDirectMessages */
// Direct method.
// Method related to the seeding function im going to create in the Gig Service.
// So when i create the seeding for the gig, the gig will request for some
// seller's documents. So for example, i want to create 10 gigs. Then im going
// to request for random sellers. So this is the the function that i consume
// the messages and then publish it back to the Gig service.
const consumeSeedGigDirectMessages = async (channel: Channel): Promise<void> => {
  // So here im going to get the consumed messages coming from the Gig Service
  // with exchange name, the routing key and the queue name. And then i get the
  // data (i.e `getRandomSellers`) that it requested and then i send the
  // message back to the Gig Service.
  try {
    if (!channel) {
      channel = (await createConnection()) as Channel;
    }
    const exchangeName = 'tradenexus-gig';
    const routingKey = 'get-sellers';
    const queueName = 'user-gig-queue';
    await channel.assertExchange(exchangeName, 'direct');
    const tradenexusQueue: Replies.AssertQueue = await channel.assertQueue(queueName, { durable: true, autoDelete: false });
    await channel.bindQueue(tradenexusQueue.queue, exchangeName, routingKey);
    // consume the message
    channel.consume(tradenexusQueue.queue, async (msg: ConsumeMessage | null) => {
      // So this message will come the Gig Service once i create the endpoint to
      // seed gig data.
      const { type } = JSON.parse(msg!.content.toString());
      if (type === 'getSellers') {
        // This `count` is going to be the number of random sellers that i want
        // to get
        const { count } = JSON.parse(msg!.content.toString());
        const sellers: ISellerDocument[] = await getRandomSellers(parseInt(count, 10));
        // Now i want to send this `sellers` information back to the Gig Service.
        await publishDirectMessage(
          channel,
          // name of exchange
          'tradenexus-seed-gig',
          // routing key
          'receive-sellers',
          // message i want to publish to the Gigs Service
          JSON.stringify({ type: 'receiveSellers', sellers, count }),
          'Message sent to gig service.'
        );
      }

      channel.ack(msg!);
    });
  } catch (error) {
    log.log('error', 'UsersService UserConsumer consumeSeedGigDirectMessages() method error:', error);
  }
};

export { consumeBuyerDirectMessage, consumeSellerDirectMessage, consumeReviewFanoutMessages, consumeSeedGigDirectMessages };
