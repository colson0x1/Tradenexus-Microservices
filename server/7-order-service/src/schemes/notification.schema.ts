// This will just be the schema for the Order notifications that im going to
// add to the database.
// Im adding it here because its just related to the order service. its not like
// notification that will be used in multiple services. So if i want to implement
// a notifications, the type of notification im going to implement whereby i
// save the information in the database, then it will make more sense to either
// add it to the notification service, add my database or i can add it or create
// a different type of service to manage the notifications.
// But here the notifications is only just going to be used in the order service.

import { IOrderNotifcation } from '@colson0x1/tradenexus-shared';
import { model, Model, Schema } from 'mongoose';

const notificationSchema: Schema = new Schema({
  // This is just going to be the id of the receiver but i want to add the
  // receiver username and the receiver picture as well.
  // There are better ways to do this but for simplicity sake, im just going to
  // do it this way.
  userTo: { type: String, default: '', index: true },
  // This sender username doesnt have to be indexed
  senderUsername: { type: String, default: '' },
  senderPicture: { type: String, default: '' },
  receiverUsername: { type: String, default: '' },
  receiverPicture: { type: String, default: '' },
  // So on the frontend, if this isRead is false, then im going to probably
  // add a background color to indicate to the user that this message has
  // not been read or this notification has not been read.
  isRead: { type: Boolean, default: false },
  message: { type: String, default: '' },
  orderId: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const OrderNotificationModel: Model<IOrderNotifcation> = model<IOrderNotifcation>(
  'OrderNotification',
  notificationSchema,
  'OrderNotification'
);
export { OrderNotificationModel };
