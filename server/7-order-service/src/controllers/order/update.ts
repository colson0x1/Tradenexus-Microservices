// In the update controller, im going to have a controller to cancel an order.
// And when a buyer or a seller cancels an order, i need to create or call
// the refunds create method. So i need to use Stripe to call stripe refunds.
// SO that the money can be refunded to the buyer based on the customer id
// that i specified in the order.

import crypto from 'crypto';

import { BadRequestError, IDeliveredWork, IOrderDocument, uploads } from '@colson0x1/tradenexus-shared';
import { config } from '@order/config';
import { orderUpdateSchema } from '@order/schemes/order.schema';
import {
  approveDeliveryDate,
  approveOrder,
  cancelOrder,
  rejectDeliveryDate,
  requestDeliveryExtension,
  sellerDeliverOrder
} from '@order/services/order.service';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import Stripe from 'stripe';
import { UploadApiResponse } from 'cloudinary';

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

// Method to deliver the order.
// When the seller delivers the order, they will likely add a file or some files.
// maybe a zip file, an image file, whatever file.
const deliverOrder = async (req: Request, res: Response): Promise<void> => {
  const { orderId } = req.params;

  // Whatever file that is going to be sent by the seller, i want to upload
  // it so that i get a URL.
  let file: string = req.body.file;
  // So what is happening here is, if there's  a file, then i create this
  // random characters using the crypto module.
  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  const randomCharacters: string = randomBytes.toString('hex');
  let result: UploadApiResponse;
  if (file) {
    // And then i check if the file type is a zip file.
    // Then i upload by creating a public id for the zip with the random
    // characters .zip
    // Else if its just a normal file without the zip, that is not the zip,
    // then i just normally call this `uploads` method.
    // This method will upload any file type that is not a video.
    result = (req.body.fileType === 'zip' ? await uploads(file, `${randomCharacters}.zip`) : await uploads(file)) as UploadApiResponse;
    if (!result.public_id) {
      // And then if there's no public id, i throw this error.
      throw new BadRequestError('File upload error. Try again', 'Update deliverOrder() method');
    }

    // Otherwise i set the secure URL.
    file = result?.secure_url;
  }
  const deliveredWork: IDeliveredWork = {
    message: req.body.message,
    // I set the file. whatever the file is going to be.
    file,
    // Because i want to display the file type on the frontend. So that is why
    // i added fileType, fileSize and fileName.
    fileType: req.body.fileType,
    fileName: req.body.fileName,
    fileSize: req.body.fileSize,
  };

  // The method i want to call is on the order.service.ts
  const order: IOrderDocument = await sellerDeliverOrder(orderId, true, deliveredWork);
  // And with that, i get the order and im sending the order to the frontend.
  res.status(StatusCodes.CREATED).json({ message: 'Order delivered successfully.', order });
};

export { cancel, requestExtension, deliveryDate, buyerApproveOrder, deliverOrder };
