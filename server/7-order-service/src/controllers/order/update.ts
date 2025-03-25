// In the update controller, im going to have a controller to cancel an order.
// And when a buyer or a seller cancels an order, i need to create or call
// the refunds create method. So i need to use Stripe to call stripe refunds.
// SO that the money can be refunded to the buyer based on the customer id
// that i specified in the order.

import { BadRequestError, IOrderDocument } from '@colson0x1/tradenexus-shared';
import { config } from '@order/config';
import { orderUpdateSchema } from '@order/schemes/order.schema';
import {
  approveDeliveryDate,
  approveOrder,
  cancelOrder,
  rejectDeliveryDate,
  requestDeliveryExtension
} from '@order/services/order.service';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import Stripe from 'stripe';

const stripe: Stripe = new Stripe(config.STRIPE_API_KEY!, {
  typescript: true
});

// Method to cancel an order
const cancel = async (req: Request, res: Response): Promise<void> => {
  // Here i use stripe to create a refund.
  await stripe.refunds.create({
    // im going to send this paymentIntent from the client to the API gateway
    // and then to this order service.
    payment_intent: `${req.body.paymentIntent}`
  });
  const { orderId } = req.params;
  // And here i call the cancel order method.
  // This `req.body.orderData`, im going to send as well from the frontend.
  await cancelOrder(orderId, req.body.orderData);
  res.status(StatusCodes.CREATED).json({ message: 'Order cancelled successfully.' });
};

// Method for request delivery extension
const requestExtension = async (req: Request, res: Response): Promise<void> => {
  const { error } = await Promise.resolve(orderUpdateSchema.validate(req.body));
  if (error?.details) {
    throw new BadRequestError(error.details[0].message, 'Update requestExtension() method');
  }

  const { orderId } = req.params;
  const order: IOrderDocument = await requestDeliveryExtension(orderId, req.body);
  // So im sending the order object back to the API gateway.
  res.status(StatusCodes.CREATED).json({ message: 'Order delivery request', order });
};

// Method that will handle the approval or rejection delivery cases.
const deliveryDate = async (req: Request, res: Response): Promise<void> => {
  const { error } = await Promise.resolve(orderUpdateSchema.validate(req.body));
  if (error?.details) {
    throw new BadRequestError(error.details[0].message, 'Update deliveryDate() method');
  }

  // From the params, i get the orderId and the type.
  const { orderId, type } = req.params;
  const order: IOrderDocument = type === 'approve' ? await approveDeliveryDate(orderId, req.body) : await rejectDeliveryDate(orderId);
  res.status(StatusCodes.CREATED).json({ message: 'Order delivery date extension', order });
};

const buyerApproveOrder = async (req: Request, res: Response): Promise<void> => {
  // For this i just need the orderId from req.params
  const { orderId } = req.params;
  const order: IOrderDocument = await approveOrder(orderId, req.body);
  // And with that, i get the order and im sending the order to the frontend.
  res.status(StatusCodes.CREATED).json({ message: 'Order approved successfully.', order });
};

export { cancel, requestExtension, deliveryDate, buyerApproveOrder };
