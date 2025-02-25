/* import { consumeSeedDirectMessage } from '@gig/queues/gig.consumer'; */
import { publishDirectMessage } from '@gig/queues/gig.producer';
import { gigChannel } from '@gig/server';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

const gig = async (req: Request, res: Response): Promise<void> => {
  const { count } = req.params;
  // so here in the gig controller, im going to publish a message to the Users
  // service telling the Users service that i need some sellers i.e i need the
  // documents for this particular number of sellers so whatever the `count`
  // number above is. so say count number is 10. then i send the message to the
  // Users service saying, i need 10 random sellers i.e the document for 10
  // random sellers. so i publish an event here.
  // So what is happening here when this gig controller method is called is,
  // im going to publish a message. If this `count` is 10. i publish a
  // message to the Users service telling that the Users service that i need
  // 10 documents of 10 different random sellers. So i publish the message and
  // then the message is consumed there on the `users/src/queues/user.consumer.ts -> consumeSeedGigDirectMessages()`
  // the exchange name and the routing key there matches here.
  // So the Users service will consume the message and then there, if it says
  // type is equal to `getSellers`. so the seed or the gig service method
  // will ask for 10 random sellers document. so there i get the count through
  // destructuring and then i use that count to get the random sellers. so
  // it returns the random `sellers` there as `ISellerDocument[]` array. and there,
  // i publish the result of `sellers` back to the Gig Service. so that is where
  // im publishing the result back.
  // And here on Gig Service inside gig.consumer.ts i.e `gig/src/queues/gig.consumer.ts -> consumeSeedDirectMessages`
  // that is where im consuming the messages from the Users service. So the
  // message published from user.consumer.ts, im consuming it on gig.consumer.ts
  // And there on gig.consumer.ts, it contains the `sellers` array and the `count`
  // which are passed into the `seedData` function.
  // i.e here i publish the message asking the user consumer for some random
  // sellers information or documents and then once its returned, i consume
  // the message after this publish and then add them to the database
  await publishDirectMessage(
    gigChannel,
    'tradenexus-gig',
    'get-sellers',
    JSON.stringify({ type: 'getSellers', count }),
    'Gig seed message sent to user service.'
  );
  // so i publish the message above and then the result, im going to consume
  // it right here and there on the consumer i.e `gigsrc/queues/gig.consumer.ts`,
  // im calling the `seedData` function
  // NOTE: The right location for this method to call is in server -> startQueues
  // method i.e im moving this seed data consumer method to server start queues
  // method. Im doing it because the message will not be consumed. it will call
  // publish direct message, call the message and then show the response and the
  // message will not be consumed. its going to be consume message and going
  // to work properly when its on server start queues method.
  /* await consumeSeedDirectMessage(gigChannel); */
  // Im not sending this to the frontend
  res.status(StatusCodes.CREATED).json({ message: 'Gig created successfully' });
};

export { gig };
