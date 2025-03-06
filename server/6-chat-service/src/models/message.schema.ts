/* message.schema.ts or message.model.ts both are same. i just decided to go
 * with the message.schema.ts naming convention. */

/* @ Message Schema */

import { IMessageDocument } from '@colson0x1/tradenexus-shared';
import { model, Model, Schema } from 'mongoose';

const messageSchema: Schema = new Schema(
  {
    conversationId: { type: String, required: true, index: true },
    senderUsername: { type: String, required: true, index: true },
    receiverUsername: { type: String, required: true, index: true },
    senderPicture: { type: String, required: true },
    receiverPicture: { type: String, required: true },
    // Now information related to the message itself
    // The reason why this `body` property is not required is because maybe the
    // sender or the receiver could send a message without a text. They could
    // send maybe an image or a gif. So without a body message, i set this to
    // an empty string.
    body: { type: String, default: '' },
    // I could have added these file related properties in an object but i decided
    // to to just separate them. I could decide to add them as, just add one
    // object and then the object will have all of these properties.
    // Example:
    // file: {
    //  fileType: { type: String, default: '' },
    //  fileSize: { type: String, default: '' },
    //  fileName: { type: String, default: '' },
    // }
    file: { type: String, default: '' },
    fileType: { type: String, default: '' },
    fileSize: { type: String, default: '' },
    fileName: { type: String, default: '' },
    gigId: { type: String, default: '' },
    buyerId: { type: String, required: true },
    sellerId: { type: String, required: true },
    // `isRead` will be used to check if the message has been read either by the
    // seller or the buyer.
    isRead: { type: Boolean, default: false },
    // If the seller sends an offer, then `hasOffer` will be set to true.
    hasOffer: { type: Boolean, default: false },
    // constructing the offer object
    offer: {
      gigTitle: { type: String, default: '' },
      // the `price` that the seller is adding to the custom offer
      price: { type: Number, default: 0 },
      description: { type: String, default: '' },
      // how long the delivery will be. So this is how the the seller will take
      // to complete the task.
      deliveryInDays: { type: Number, default: 0 },
      // So this old delivery date will be like the first date that the seller
      // says they will deliver the service and then if probably in the process
      // of working on the service, the seller then requests for an extension.
      // So if the seller requests for an extension and then the extension is
      // approved, i'll still have the `oldDeliveryDate` but then the new changed
      // date will be the `newDeliveryDate`. So if the buyer approves the extension
      // request from the seller, then i add the new delivery date but i will also
      // have the old delivery date.
      oldDeliveryDate: { type: String, default: '' },
      newDeliveryDate: { type: String, default: '' },
      // `accepted` and `cancelled` are for the custom offer.
      accepted: { type: Boolean, default: false },
      cancelled: { type: Boolean, default: false }
    },
    // default can be added but i'll just leave it to type
    /* createdAt: { type: Date, default: Date.now } */
    createdAt: { type: Date }
  },
  {
    // One last thing i want to add is to remove the version key
    versionKey: false
  }
);

// collection name is `Message`
const MessageModel: Model<IMessageDocument> = model<IMessageDocument>('Message', messageSchema, 'Message');
export { MessageModel };
