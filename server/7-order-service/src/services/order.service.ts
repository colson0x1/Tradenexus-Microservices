// Methods required for Order Service.
// Im going to add method to GET, CREATE and UPDATE.

import { IOrderDocument, IOrderMessage, lowerCase } from '@colson0x1/tradenexus-shared';
import { OrderModel } from '@order/models/order.schema';
import { publishDirectMessage } from '@order/queues/order.producer';
import { orderChannel } from '@order/server';
import { config } from '@order/config';
import { sendNotification } from './notification.service';

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
  // This message in the string is what will be displayed on the dropdown on
  // the frontend.
  // So on the frontend, on the seller's page, when they click on the dropdown
  // i.e notification dropdown, they should see this message. its going to be
  // something like whatever buyer placed an order for your gig.
  sendNotification(order, data.sellerUsername, 'placed an order for your gig.');

  return order;
};
