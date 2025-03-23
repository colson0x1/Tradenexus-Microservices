// Here im giong to add four methods.
// One will be to create the notification in the database. One will be to get
// the notifications then to mark notifications as read. And then the last one
// will be to send notification with Socket.io

import { IOrderDocument, IOrderNotifcation } from '@colson0x1/tradenexus-shared';
import { OrderNotificationModel } from '@order/schemes/notification.schema';
import { socketIOOrderObject } from '@order/server';

// This will just be used to create the notification.
const createNotification = async (data: IOrderNotifcation): Promise<IOrderNotifcation> => {
  const notification: IOrderNotifcation = await OrderNotificationModel.create(data);
  return notification;
};

const getNotificationsById = async (userToId: string): Promise<IOrderNotifcation[]> => {
  // I can use the find method here but i think the aggregate method makes more
  // sense.
  const notifications: IOrderNotifcation[] = await OrderNotificationModel.aggregate([
    // So here im looking for the documents where the userTo matches the userToId
    // that is passed in.
    // i.e I want to match every document or get every document where the `userTo`
    // matches the `userToId`
    // In notification.schema.ts model, i can see this `userTo` which is an id
    // and is indexed.
    { $match: { userTo: userToId } },
    // And then im sorting the documents by the createdAt property in descending
    // order. So the newest notifications will be on top.
    { $sort: { createdAt: -1 } }
  ]);
  return notifications;
};

// Method to mark notification as read
const markNotificationAsRead = async (notificationId: string): Promise<IOrderNotifcation> => {
  // Im not using aggregate here. instead im using findOneAndUpdate. Here i want
  // to update the document and then return it.
  const notification: IOrderNotifcation = (await OrderNotificationModel.findOneAndUpdate(
    // I want to update the document where the `_id` matches the `notificationId`
    { _id: notificationId },
    // Now i want to use a set operator so i want to update a field.
    // And then i want to update the `isRead` property and set it to true
    { $set: { isRead: true } },
    // And then im setting the `new` property to true because i want to return
    // the new updated document, not the old one.
    // i.e The findOneAndUpdate always return the object. If i dont set this
    // new property, its going to return the old object before it was updated.
    // But with this new, it will return the updated document itself.
    { new: true }
  )) as IOrderNotifcation;
  // Once the update is complete, im going to use Socket.io to send the information.
  // ToDo
  return notification;
};

// Im going to use this method in the Order service. Its just going to be the
// method with Socket.io that i create the notification and then emit the
// Socket.io event.
// So whenever this method is called, i create the notification and then send
// it using socket.io order object method to emit the event or send it to the
// api gateway.
const sendNotification = async (data: IOrderDocument, userToId: string, message: string): Promise<void> => {
  // Here im constructing socket.io object that i want to send to my api gateway.
  const notification: IOrderNotifcation = {
    // So this is the information that i want to send to the api gateway and then
    // the api gateway will send it to the frontend.
    userTo: userToId,
    senderUsername: data.sellerUsername,
    senderPicture: data.sellerImage,
    receiverUsername: data.buyerUsername,
    receiverPicture: data.buyerImage,
    message,
    orderId: data.orderId
  } as IOrderNotifcation;
  const orderNotification: IOrderNotifcation = await createNotification(notification);
  // Here i want to pass two sets of data. I want to pass this `data` object
  // in the params that is this `IOrderDocument` and then i want to pass this
  // `orderNotification` as well.
  // So the order documents and the order notification documents, im sending
  // to the API gateway.
  // Everytime i emit a notification, im always going to be using this
  // `order notification` event name.
  socketIOOrderObject.emit('order notification', data, orderNotification);
};

export { createNotification, getNotificationsById, markNotificationAsRead };
