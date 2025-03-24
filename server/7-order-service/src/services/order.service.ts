// Methods required for Order Service.
// Im going to add method to GET, CREATE and UPDATE.

import { IDeliveredWork, IOrderDocument, IOrderMessage, lowerCase } from '@colson0x1/tradenexus-shared';
import { OrderModel } from '@order/models/order.schema';
import { publishDirectMessage } from '@order/queues/order.producer';
import { orderChannel } from '@order/server';
import { config } from '@order/config';
import { sendNotification } from '@order/services/notification.service';

/* @ GET methods */

export const getOrderByOrderId = async (orderId: string): Promise<IOrderDocument> => {
  // I can either use findOne/findById or aggregate. Since i've been using the
  // aggregate so im going to be using that here too.
  // Here array [] because aggregates returns an array.
  // This aggregate method is more optimized. its faster than the other methods
  // so that is why im  using the aggregate method.
  const order: IOrderDocument[] = await OrderModel.aggregate([
    // Here i want to match any document where the orderId matches this
    // `orderId` that im passing in the params.
    // I have indexed `orderId` in the order.schema.ts model because i'll search
    // for documents based on the orderId.
    { $match: { orderId } }
  ]);
  // Aggregate will return an array but i only need the document. So returning
  // order at index 0. Because i only want to return a document, not an array.
  return order[0];

  // Here the same implementation using `findOne` instead
  /*
  const order: IOrderDocument = (await OrderModel.findOne({ orderId }).exec()) as IOrderDocument;
  return order;
  */
};

export const getOrdersBySellerId = async (sellerId: string): Promise<IOrderDocument[]> => {
  const orders: IOrderDocument[] = await OrderModel.aggregate([
    // Here i want to match any document where the sellerId matches whatever
    // im sending into this method i.e through sellerId params. So im using
    // this to fetch the seller orders and its going to be an array.
    { $match: { sellerId } }
  ]);
  return orders;
};

export const getOrdersByBuyerId = async (buyerId: string): Promise<IOrderDocument[]> => {
  const orders: IOrderDocument[] = await OrderModel.aggregate([{ $match: { buyerId } }]);
  return orders;
};

/* @ CREATE/POST methods */

// When an order is created by a seller, im going to publish an event to the
// sellers in Users service. And im also going to publish a separate event
// or an email to the notification service.
// @ Method to create an order
export const createOrder = async (data: IOrderDocument): Promise<IOrderDocument> => {
  // `create` method will always return the created document.
  const order: IOrderDocument = (await OrderModel.create(data)) as IOrderDocument;
  // In Users Service inside user.consumer.ts, there is consumeSellerDirectMessage
  // method. I need to publish a message to the Users Service with exchange name
  // of `tradenexus-seller-update` and routing key of `user-seller`. And then
  // im goint to set the type of `create-order`
  const messageDetails: IOrderMessage = {
    sellerId: data.sellerId,
    // Ongoing jobs means that seller has started the job. So i increment the
    // ongoing jobs by 1.
    ongoingJobs: 1,
    type: 'create-order'
  };
  // @ update the seller info
  // Now i need to publish the event to the exchange and routing key defined
  // on User service -> user.consumer.ts as well.
  // So this method will publish an event to the Users service to update
  // the seller's ongoing jobs property in the seller's schema.
  await publishDirectMessage(
    orderChannel,
    'tradenexus-seller-update',
    'user-seller',
    JSON.stringify(messageDetails),
    'Details sent to users service'
  );
  // Send an email or an email event to the notification service.
  // This email will be to the seller to let the seller know that buyer has
  // placed an order. So I send this message.
  const emailMessageDetails: IOrderMessage = {
    orderId: data.orderId,
    // Im going to set this invoice id on the frontend. It will come from the
    // frontend. I'll just generate it on the frontend and then send it.
    invoiceId: data.invoiceId,
    orderDue: `${data.offer.newDeliveryDate}`,
    amount: `${data.price}`,
    buyerUsername: lowerCase(data.buyerUsername),
    sellerUsername: lowerCase(data.sellerUsername),
    title: data.offer.gigTitle,
    description: data.offer.description,
    requirements: data.requirements,
    serviceFee: `${order.serviceFee}`,
    total: `${order.price + order.serviceFee!}`,
    // This order url is going to be the URL for the orders page. So from the
    // email, when the seller or the buyer clicks on the order URL, im going
    // to open the page based on this URL on the frontend and it will display
    // the orders page.
    orderUrl: `${config.CLIENT_URL}/orders/${data.orderId}/activities`,
    template: 'orderPlaced'
  };
  // Now publish the email i.e send the email
  await publishDirectMessage(
    orderChannel,
    // This will go to the Notification Service
    'tradenexus-order-notification',
    'order-email',
    JSON.stringify(emailMessageDetails),
    // This message is for console so that i know that the message was
    // actually sent.
    'Order email sent to notification service'
  );
  // @ This notification will be sent to the seller.
  // This message in the string is what will be displayed on the dropdown on
  // the frontend.
  // So on the frontend, on the seller's page, when they click on the dropdown
  // i.e notification dropdown, they should see this message. its going to be
  // something like whatever buyer placed an order for your gig.
  sendNotification(order, data.sellerUsername, 'placed an order for your gig.');

  return order;
};

// @ Method to cancel an order.
// So here on this method, once i update in the order documents in the database,
// i publish an event to the users service to update the seller. And then i
// publish another event to update the buyer. Then send notification.
export const cancelOrder = async (orderId: string, data: IOrderMessage): Promise<IOrderDocument> => {
  const order: IOrderDocument = (await OrderModel.findOneAndUpdate(
    // In this findOneAndUpdate, i want to update the document that matches the
    // `orderId`.
    { orderId },
    // And then im going to use the set operator because i want to update some
    // specific fields.
    // order.schema.ts
    // What are the fields i want to update is: i want to update the `status`,
    // `cancelled` property to true and `approvedAt` date.
    {
      $set: {
        // So these are the properties that i want to update once the order
        // is cancelled.
        cancelled: true,
        status: 'Cancelled',
        approvedAt: new Date()
      }
    },
    // Here im setting the `new` property to true because i want to return the
    // new updated document, not the old one.
    { new: true }
  ).exec()) as IOrderDocument;
  // @ Update Seller info
  // Now i need to publish a normal event to the Users service.
  // User servive -> user.consumer.ts on the type === 'cancel-order'
  await publishDirectMessage(
    orderChannel,
    'tradenexus-seller-update',
    'user-seller',
    //  I need the seller id there so im passing `sellerId`
    JSON.stringify({ type: 'cancel-order', sellerId: data.sellerId }),
    'Cancelled order details sent to users service.'
  );
  // @ Update Buyer info
  // also i need to update the buyer
  // User Service ->  user.consumer.ts
  await publishDirectMessage(
    orderChannel,
    'tradenexus-buyer-update',
    'user-buyer',
    // Here type can be anything i want except `auth` because its there on the
    // user.consumer.ts. So since type can be anything, im leaving it as
    // `cancel-order`
    // In user.consumer.ts, im saying if there's anything that is not `auth`,
    // then i execute this `updateBuyerPurchasedGigsProp` method.
    // Here `purchasedGigs` is just the id of the gig that the buyer or seller
    // has cancelled.
    JSON.stringify({ type: 'cancel-order', buyerId: data.buyerId, purchasedGigs: data.purchasedGigs }),
    'Cancelled order details sent to users service.'
  );
  // @ This notification will be sent to the buyer.
  sendNotification(order, order.sellerUsername, 'cancelled your order delivery.');

  return order;
};

// @ Method to approve an order
export const approveOrder = async (orderId: string, data: IOrderMessage): Promise<IOrderDocument> => {
  const order: IOrderDocument = (await OrderModel.findOneAndUpdate(
    { orderId },
    {
      $set: {
        // Update the `approved` property as in order.schema.ts along with
        // `status` and `approvedAt` date.
        // So the order will not be completed until the user approves. So once
        // the user approves, i set approved to true, status to completed and
        // approved at to new date.
        approved: true,
        status: 'Completed',
        approvedAt: new Date()
      }
    },
    { new: true }
  ).exec()) as IOrderDocument;
  // User Service -> user.consumer.ts
  // There, when type === `approve-order`, it expects the `sellerId`, `ongoingJobs`,
  // `completedJobs`, `totalEarnings` and `recentDelivery`. So these are the
  // properties that i need to send.
  const messageDetails: IOrderMessage = {
    sellerId: data.sellerId,
    buyerId: data.buyerId,
    ongoingJobs: data.ongoingJobs,
    completedJobs: data.completedJobs,
    totalEarnings: data.totalEarnings, // this is the price the seller earned for lastest order delivered
    recentDelivery: `${new Date()}`,
    type: 'approve-order'
  };
  // So this will be used to update the seller info.
  await publishDirectMessage(
    orderChannel,
    'tradenexus-seller-update',
    'user-seller',
    //  I need the seller id there so im passing `sellerId`
    JSON.stringify(messageDetails),
    'Approved order details sent to users service.'
  );
  // Update the buyer infor.
  await publishDirectMessage(
    orderChannel,
    'tradenexus-buyer-update',
    'user-buyer',
    // user.consumer.ts -> `updateBuyerPurchasedGigsProp` inside the method
    // implementation, im using type === `purchased-gigs`. So this is the type
    // that i want to use.
    // Note: if the type is `purchased-gigs`, i add i.e $push and if the type
    // is anything else than `purchased-gigs`, then i remove i.e $pull.
    JSON.stringify({ type: 'purchased-gigs', buyerId: data.buyerId, purchasedGigs: data.purchasedGigs }),
    'Approved order details sent to users service.'
  );
  // This notification message will go to the seller.
  sendNotification(order, order.sellerUsername, 'approved your order delivery.');

  return order;
};

// The properties that i want to update is `status`. So i set  this status
// to delivered. also the `delivered` property. And then i want to update
// `events` object. So im going to update this `orderDelivered` property inside
// the `events` object located in order.schema.ts
// So this is going to be when the seller delivers the order by sending maybe
// zip file, video file or whatever file or an image file.
// So this is what i need inorder for the seller to deliver an order.
export const deliverOrder = async (orderId: string, delivered: boolean, deliveredWork: IDeliveredWork): Promise<IOrderDocument> => {
  const order: IOrderDocument = (await OrderModel.findOneAndUpdate(
    // I want to update the documents that matches the `orderId`.
    { orderId },
    {
      $set: {
        delivered,
        status: 'Delivered',
        // Im not going to update `approvedAt`. The approved at will only be
        // updated either when the order was cancelled or the buyer approves the
        // delivery. But here i want to update the `orderDelivered` property
        // from the `events` object.
        ['events.orderDelivered']: new Date()
      },
      // Now i need to add this `deliveredWork` to the array. So this will
      // just contain an object with `message` from the seller, the url of the
      // `file`, `fileType`, `fileSize` and the `fileName`. So im going to
      // push this `deliveredWork` work into the `deliveredWork` array.
      $push: { deliveredWork }
    },
    // So those are the updates i want to make and i want to return the new
    // document.
    { new: true }
  ).exec()) as IOrderDocument;

  if (order) {
    // User Service -> user.consumer.ts
    // Now i want to publish an event by sending an email
    // So this is going to be for sending an email.
    const messageDetails: IOrderMessage = {
      orderId,
      buyerUsername: lowerCase(order.buyerUsername),
      sellerUsername: lowerCase(order.sellerUsername),
      title: order.offer.gigTitle,
      description: order.offer.description,
      // So this is going to be the order url. when it is clicked from the
      // email, it should open a new page in the browser.
      orderUrl: `${config.CLIENT_URL}/orders/${orderId}/activities`,
      // Because im sending an email, so the name of the template is: orderDelivered
      template: 'orderDelivered'
    };
    // So i want to send an email to the buyer letting them know that the seller
    // has delivered the work.
    // This publishDirectMessage will send an email.
    await publishDirectMessage(
      orderChannel,
      // notification service
      'tradenexus-order-notification',
      'order-email',
      JSON.stringify(messageDetails),
      // This is just so i see information in  the console that the event
      // was sent.
      'Order delivered message sent to notification service.'
    );
    // This notification message will go to the buyer.
    // This sendNotification will just send an in-app notification so that
    // i see it in a dropdown.
    sendNotification(order, order.buyerUsername, 'delivered your order.');
  }

  return order;
};
