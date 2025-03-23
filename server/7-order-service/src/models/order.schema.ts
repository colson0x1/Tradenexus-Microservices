import { IOrderDocument } from '@colson0x1/tradenexus-shared';
import { model, Model, Schema } from 'mongoose';

// This schema will handle the orders created by the buyer and also being
// worked on by the seller.

const orderSchema: Schema = new Schema(
  // In the chat, seller can send offer to the buyer.
  {
    offer: {
      gigTitle: { type: String, required: true },
      price: { type: Number, required: true },
      description: { type: String, required: true },
      deliveryInDays: { type: Number, required: true },
      oldDeliveryDate: { type: Date },
      newDeliveryDate: { type: Date },
      accepted: { type: Boolean, required: true },
      cancelled: { type: Boolean, required: true },
      reason: { type: String, default: '' }
    },
    gigId: { type: String, required: true },
    // Here `sellerId` is indexed because im going to get orders by the
    // sellerId.
    sellerId: { type: String, required: true, index: true },
    // Because the username and email won't be changed. that is wht i added
    // them here as `sellerUsername` and `sellerEmail`.
    sellerUsername: { type: String, required: true },
    sellerImage: { type: String, required: true },
    sellerEmail: { type: String, required: true },
    // Here are informations related to the gig.
    gigCoverImage: { type: String, required: true },
    gigMainTitle: { type: String, required: true },
    gigBasicTitle: { type: String, required: true },
    gigBasicDescription: { type: String, required: true },
    // Buyer details
    buyerId: { type: String, required: true, index: true },
    buyerUsername: { type: String, required: true },
    buyerEmail: { type: String, required: true },
    buyerImage: { type: String, required: true },
    // Once the order is started by the seller, the status will be `ongoing`.
    // And if the order was completed or approved, the status will be `completed`
    // And if the order was cancelled, the status will be `cancelled`.
    status: { type: String, required: true },
    orderId: { type: String, required: true, index: true },
    // So the order like what is the quantity. This will always likely be one.
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    // Im going to implement some kind of calculations with respect to this
    // service fee.
    serviceFee: { type: Number, default: 0 },
    // Im going to add a string which is going to be the requirements. So before
    // the buyer starts the order or creates the order, there's going to be a
    // field for requirements. They can add the text with the requirements or
    // they can skip it.
    requirements: { type: String, default: '' },
    // If it is approved, this will be true.
    approved: { type: Boolean, default: false },
    // If it is delivered, this will be true.
    delivered: { type: Boolean, default: false },
    // If it is cancelled, this will be true.
    cancelled: { type: Boolean, default: false },
    // approvedAt date is at what time it was `approved` or at what time it was
    // `delivered` or at what time it was `cancelled`. so this will be updated
    // if it was approved or delivered or cancelled.
    approvedAt: { type: Date },
    // This is going to be an id coming from Stripe. So this is stripe
    // payment intent information.
    paymentIntent: { type: String },
    // This delivered work will be when the seller delivers the work.
    // They can add image and they send the file. So whatever file they are
    // going to send, if its an image file, if its a zip file, if its a video
    // file, we'll just upload them and then, add the url here and then add the
    // type. so on the frontend when the user clicks on the icon that will be
    // used to display this delivered work, the buyer should be able to download.
    deliveredWork: [
      {
        message: { type: String },
        file: { type: String },
        fileType: { type: String },
        fileSize: { type: String },
        fileName: { type: String }
      }
    ],
    // And this is the object for seller to request an extension. so when they
    // request an extension, i have the original date, new date in days like
    // how many days do they want and reason why they are requesting for an
    // extension.
    requestExtension: {
      originalDate: { type: String, default: '' },
      newDate: { type: String, default: '' },
      days: { type: Number, default: 0 },
      reason: { type: String, default: '' }
    },
    // Date that the gig was ordered.
    dateOrdered: { type: Date, default: Date.now },
    // This is going to be the events that im going to display on the frontend.
    // So im going to use all of these events to display information on the
    // order page on the frontend.
    events: {
      // Date when the order was placed.
      placeOrder: { type: Date },
      // Date when the requirements was set.
      requirements: { type: Date },
      // The date when the order was started.
      orderStarted: { type: Date },
      // delivery date update so if the user requests for an extension and it
      // was approved then im going to update this delivery date property in the
      // events.
      deliveryDateUpdate: { type: Date },
      // When the seller delivers the order, im going to update this property.
      orderDelivered: { type: Date },
      // If a buyer adds a review, i update this property.
      buyerReview: { type: Date },
      // If a seller adds a review, i update this property.
      sellerReview: { type: Date }
    },
    // Object for the buyer review and seller review because this order is
    // going to be 1 to 1 mapping. So its going to be 1 buyer / 1 seller to
    // 1 order.
    buyerReview: {
      rating: { type: Number, default: 0 },
      review: { type: String, default: '' },
      created: { type: Date }
    },
    sellerReview: {
      rating: { type: Number, default: 0 },
      review: { type: String, default: '' },
      created: { type: Date }
    }
  },
  {
    versionKey: false
  }
);

const OrderModel: Model<IOrderDocument> = model<IOrderDocument>('Order', orderSchema, 'Order');
export { OrderModel };
