// Im going to create two consumer methods. One will be to consume messages
// that will be coming from the Users Service and is going to be related to
// the seed data. And then, the other one is going to be consuming messages
// also from the User Service. They are both going to have different exchanges
// and routing keys.

import { winstonLogger } from '@colson0x1/tradenexus-shared';
import { Channel, Replies, ConsumeMessage } from 'amqplib';
import { Logger } from 'winston';
import { config } from '@gig/config';
import { createConnection } from '@gig/queues/connection';
import { seedData, updateGigReview } from '@gig/services/gig.service';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'gigServiceConsumer', 'debug');

// For this the messages will come from the Users Service.
// If we go to `user.consumer.ts` from Users Service, in the `consumeReviewFanoutMessage`
// method, under the case where type equals `buyer-review`, im publishing
// the message where the exchange is called `tradenexus-update-gig` and then
// the `routingKey` is called `update-gig` and then i send the `type` in the
// stringified JSON there. The type is of `updateGig` and i also send the gigReview.
// So there on the `consumeReviewFanoutMessage` method, i listen for messages
// coming from the `tradenexus-review` exchange and if the type is `buyer-review`,
// then i publish it to the Gig Service. So what is what i want to listen for.
// So im using that same exchange name, routing key and queueName here and the
// exchange is going to be direct.
const consumeGigDirectMessage = async (channel: Channel): Promise<void> => {
  try {
    if (!channel) {
      channel = (await createConnection()) as Channel;
    }
    const exchangeName = 'tradenexus-update-gig';
    const routingKey = 'update-gig';
    const queueName = 'gig-update-queue';
    await channel.assertExchange(exchangeName, 'direct');
    const tradenexusQueue: Replies.AssertQueue = await channel.assertQueue(queueName, { durable: true, autoDelete: false });
    await channel.bindQueue(tradenexusQueue.queue, exchangeName, routingKey);
    channel.consume(tradenexusQueue.queue, async (msg: ConsumeMessage | null) => {
      // i dont need the `type`, i only need the `gigReview` so im getting the
      // review.
      const { gigReview } = JSON.parse(msg!.content.toString());
      // Im using JSON.parse here down below to even though i already did above
      // line when destructuring gigReview is because at the top level when we
      // are publishing there on user.producer.ts, there i called `Buffer.from()`
      // so i need to use that. And also when i have the message published in
      // user.consumer.ts, i called `JSON.stringify()`.
      // So JSON.parse() above i.e on the line where im destructuring gigReview,
      // is for the top level and this, JSON.parse() below line using await, is
      // for this specific JSON.stringify() im calling right there on user.consumer.ts
      // And also, there im sending content as a string (i.e .toString()) not as
      // the content itself. So i need to pass it multiple times. That is why
      // i called JSON.parse() twice, once above and once below and then i get
      // the gig review.
      // SO this JSON.parse() i.e on the below line, is called for this
      // `toString` i.e `gigReview: msg!.content.toString()` that is on
      // user.consumer.ts
      // while the first JSON.parse() i.e above line, is called for this
      // `JSON.stringify()`, on that same line inside publishDirectMessage()
      // on user.consumer.ts so that is why i called JSON.parse() twice.
      await updateGigReview(JSON.parse(gigReview));

      // If i update and if everything is successful, i acknowledge the message
      // otherwise i throw an error
      channel.ack(msg!);
    });
  } catch (error) {
    log.log('error', 'GigService GigConsumer consumeBuyerDirectMessage() method error:', error);
  }
};

// For the second consumer, im going to need it when i create seed data but
// since i dont have it yet, i can just add the method and then i update it
// later.
const consumeSeedDirectMessage = async (channel: Channel): Promise<void> => {
  try {
    if (!channel) {
      channel = (await createConnection()) as Channel;
    }
    // The exchangeName, routingKey and queue name is coming from Users Service
    // `user.consumer.ts` inside `consumeSeedGigDirectMessage()`
    // So once i publish the message and it goes to the queue, its requesting
    // for sellers there. So before i can create gigs, i need to get sellers
    // so that i can get some sellers information. So that is where the message
    // is published (i.e await publishDirectMessage()), that im listening for
    // in this `gig.consumer.ts`. So from the user.consumer.ts, i publish
    // the message to the `tradenexus-seed-gig` exchange and then i use the
    // `receive-sellers` routing key there. And then, here i consume it.
    const exchangeName = 'tradenexus-seed-gig';
    const routingKey = 'receive-sellers';
    const queueName = 'seed-gig-queue';
    await channel.assertExchange(exchangeName, 'direct');
    const tradenexusQueue: Replies.AssertQueue = await channel.assertQueue(queueName, { durable: true, autoDelete: false });
    await channel.bindQueue(tradenexusQueue.queue, exchangeName, routingKey);
    channel.consume(tradenexusQueue.queue, async (msg: ConsumeMessage | null) => {
      const { sellers, count } = JSON.parse(msg!.content.toString());
      // This is where i need to call `seedData()`
      await seedData(sellers, count);
      channel.ack(msg!);
    });
  } catch (error) {
    log.log('error', 'GigService GigConsumer consumeBuyerDirectMessage() method error:', error);
  }
};

export { consumeGigDirectMessage, consumeSeedDirectMessage };
