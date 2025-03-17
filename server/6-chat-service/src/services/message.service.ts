// For conversation, i'll just have one document for a particular seller
// and buyer. So the conversation will have just one document. Once that is
// created, it'll only just be using the conversation id. Im not going to
// recreate it every time a message is sent.

import { ConversationModel } from '@chat/models/conversation.schema';
import { MessageModel } from '@chat/models/message.schema';
import { publishDirectMessage } from '@chat/queues/message.producer';
import { chatChannel, socketIOChatObject } from '@chat/server';
import { IConversationDocument, IMessageDetails, IMessageDocument, lowerCase } from '@colson0x1/tradenexus-shared';

const createConversation = async (conversationId: string, sender: string, receiver: string): Promise<void> => {
  await ConversationModel.create({
    conversationId,
    senderUsername: sender,
    receiverUsername: receiver
  });
};

// @ Method to add the message to the Message collection
// i.e I create the message, and then if `hasOffer` is true, then i construct
// the `emailMessageDetails`. After that i publish the email i.e message to the
// Notification service and then i sent this socket io event with the `message`
// object to the API gateway. And then i return the message.
const addMessage = async (data: IMessageDocument): Promise<IMessageDocument> => {
  // `create` method always returns the newly created document
  const message: IMessageDocument = (await MessageModel.create(data)) as IMessageDocument;
  // Now what i want to do is, i want to check if the message that has been
  // sent, if this property `hasOffer` is set to true because im going to set
  // it on the frontend. So if there is an offer, i set this `hasOffer` from
  // message.schema.ts to true on the frontend. So i need to check.
  // So if there is an offer then i need to publish or send a message so the
  // Notification service can send an email to the buyer.
  if (data.hasOffer) {
    // So if `data.hasOffer` is true then im going to send the email right here.
    // But first, i need to construct message details.
    const emailMessageDetails: IMessageDetails = {
      sender: data.senderUsername,
      // amount: data.offer?.price.toString(),
      amount: `${data.offer?.price}`,
      // buyerUsername: data.receiverUsername?.toLowerCase(),
      // because its an optional property, i need to add it as a string
      buyerUsername: lowerCase(`${data.receiverUsername}`),
      sellerUsername: lowerCase(`${data.senderUsername}`),
      title: data.offer?.gigTitle,
      description: data.offer?.description,
      // deliveryDays: data.offer?.deliveryInDays.toString(),
      deliveryDays: `${data.offer?.deliveryInDays}`,
      template: 'offer'
    };
    // And then publish the email i.e send the email
    await publishDirectMessage(
      chatChannel,
      'tradenexus-order-notification',
      'order-email',
      JSON.stringify(emailMessageDetails),
      // This message is for console so that i know that the message was
      // actually sent.
      'Order email sent to notification service'
    );
  }

  // This will be sent to the API gateway
  socketIOChatObject.emit('message received', message);
  return message;
};

// @ Method to get the conversation from the conversation collection
// i.e Method to get the conversation from the conversation schema based on the
// `sender` name and the `receiver` name that i add.
const getConversation = async (sender: string, receiver: string): Promise<IConversationDocument[]> => {
  // Im going to use the MongoDB aggregate method to get the conversation.
  // So I want to aggregate all the messages based on the conditions im going
  // to pass. And what i want to do is, so for this particular method, i dont
  // have access to the conversationId, so i only have access to the senderName
  // or receiverName. So what im going to do is, im going to use the `$OR` operator.
  // So i want to look for a document where the sender name or the receiver
  // name here on this getConversation method matches the sender or receiver name.
  const query = {
    // So if any of these critieria matches the document
    // i.e for a particular seller and buyer, im going to have only one
    // document. so im not going to have multiple documents for a seller and
    // buyer conversation.
    $or: [
      // So any object where the senderUsername is equal to the sender and the
      // receiverUsername is equal to the receiver.
      { senderUsername: sender, receiverUsername: receiver },
      // Or any object where this senderUsername matches the receiver and the
      // receiverUsername matches whatever i have in the sender
      { senderUsername: receiver, receiverUsername: sender }
    ]
  };
  // MongoDB aggregate method returns an array
  // Im using `match` operator. So `match` the documents using this `query`.
  const conversation: IConversationDocument[] = await ConversationModel.aggregate([{ $match: query }]);
  return conversation;
};

// @ Method to get the messages by their username
// So for a particular user either is buyer or a seller, i want to get all their
// messages so that i can display them on the chat list i.e on the frontend, im
// going to have a chat list so that i can see all the messages for a particular
// user. So if it is a sender, then all the other receivers that they have chatted
// with, i want to get the messages. Here im going to use the aggregate as well.
// This method will be used in the chat list on the frontend.
// i.e Method to get chat list or conversation list.
const getUserConversationList = async (username: string): Promise<IMessageDocument[]> => {
  // So this is the query i want to use. Whatever the username is, i check every
  // message where the senderUsername matches the username or the receiverUsername
  // matches the username.
  // What this means is, every message where this particular user (i.e username in the param)
  // is either a sender or a receiver. So every message where the user is
  // either a sender or a receiver, that is what i want to return.
  const query = {
    $or: [{ senderUsername: username }, { receiverUsername: username }]
  };
  // The reason why im getting this is so that i can get access to the last
  // message. So what i want to do is, i dont want to return all the messages.
  // i only want to return probably the last message that was sent either by
  // the seller or by the receiver. So the last message for every of the
  // receivers for a particular user.
  const messages: IMessageDocument[] = await MessageModel.aggregate([
    { $match: query },
    // So here im grouping the messages by the conversationId. So for every
    // conversationId, i want to get the last message that was sent.
    // i.e here im using the `$group` operator and what i want to group by is
    // i want to group by the conversationId. For example, if this particular
    // user (i.e username param) is the sender, all the messages where the
    // user is a sender, then im going to group by conversationId.
    {
      $group: {
        _id: '$conversationId',
        // I only want to get the last message that was sent
        // -1 here is descending order.
        // So the last message that was sent based on the `createdAt` property.
        // So this operator will sort the object. Once it groups, it will sort
        // them and then get the last one based on the `createdAt` property.
        result: { $top: { output: '$$ROOT', sortBy: { createdAt: -1 } } }
      }
    },
    // So after this group, i can then return the actual object that i want
    // This $project operator will allow me to pass the requested fields that
    // i want. Note: The result is going to be inside the `result` property.
    // And now this $project will allow me to get the fields that i want
    // from this `result` object right above.
    {
      $project: {
        // This is how i get properties from this `result` object thats located
        // in the $group above
        // So these are the properties that i want to get from the `result`
        // object.
        // And because this is going to be an array. If for example, this
        // particular user (i.e username param) has already chatted with probably
        // three different sellers, either as a sender or as a receiver, then
        // i should have an array of three objects. Because this particular
        // user (i.e username param) has chatted with three different sellers.
        // If the user has chatted with five different sellers, then i should
        // have five objects in the array. And for each sellers conversation,
        // it will return the last message that was sent because i want to
        // use it on my chat list.
        _id: '$result._id',
        conversationId: '$result.conversationId',
        sellerId: '$result.sellerId',
        buyerId: '$result.buyerId',
        receiverUsername: '$result.receiverUsername',
        receiverPicture: '$result.receiverPicture',
        senderUsername: '$result.senderUsername',
        senderPicture: '$result.senderPicture',
        body: '$result.body',
        file: '$result.file',
        gigId: '$result.gigId',
        isRead: '$result.isRead',
        hasOffer: '$result.hasOffer',
        createdAt: '$result.createdAt'
      }
    }
  ]);

  return messages;
};

// @ getMessages is a method to get messages using senderName and receiverName.
// Im going to use this method on the frontend, probably in the components where
// i dont have access to the conversation id.
// This  is going to be in the message model so not in the conversation model.
// This message function will take the sender and receiver name. So i want to
// get messages by the sender and receiver name.
const getMessages = async (sender: string, receiver: string): Promise<IMessageDocument[]> => {
  // So now the query for this is going to be: every message document where
  // the senderUsername matches the sender or the receiverUsername matches the
  // receiver or the senderUsername matches the receiver or the receiverUsername
  // matches the sender.
  const query = {
    // So if any of these critieria matches the document
    // i.e for a particular seller and buyer, im going to have only one
    // document. so im not going to have multiple documents for a seller and
    // buyer conversation.
    $or: [
      // So any object where the senderUsername is equal to the sender and the
      // receiverUsername is equal to the receiver.
      { senderUsername: sender, receiverUsername: receiver },
      // Or any object where this senderUsername matches the receiver and the
      // receiverUsername matches whatever i have in the sender
      { senderUsername: receiver, receiverUsername: sender }
    ]
  };
  // MongoDB aggregate method returns an array
  // Im using `match` operator. So `match` the documents using this `query`.
  const messages: IMessageDocument[] = await MessageModel.aggregate([
    { $match: query },
    // I want to add the sorting option. So i want to return the messages
    // from the oldest to the newest.
    // So here i want to sort with the `createdAt` property from the oldest
    // to the newest. So this is in ascending order because im sorting from the
    // oldest to the newest. If its -1, then its going to be from newest to the
    // oldest.
    { $sort: { createdAt: 1 } }
  ]);
  return messages;
};

// Method to get the messages using conversation id.
const getUserMessages = async (messageConversationId: string): Promise<IMessageDocument[]> => {
  const messages: IMessageDocument[] = await MessageModel.aggregate([
    // So every documents where the conversationId matches this messageConversationId.
    { $match: { conversationId: messageConversationId } },
    // And then i return the messages result in ascending order.
    { $sort: { createdAt: 1 } }
  ]);
  return messages;
};

// @ Updates the `offer` property in a particular message if the type is either
// `accepted` or `cancelled`.
// Method to update the `offer` object.
// i.e chat/src/models/message.schema.ts > offer {}
// Inside the offer object, i have this `accepted` and `cancelled` property.
// So if the buyer accepts the offer, then i want to update this `accepted`
// property to true. And if the buyer cancels or rejects the offer, then i
// want to update this `cancel` property to true.
// The reason why im doing this is so that i can apply it on the cancel
// and the update button. So i need to add a function that will be used to
// update these properties.
// Here `type` is going to be either `accepted` or `cancelled`
// `messageId` is the id of the specific message that was sent with the offer.
const updateOffer = async (messageId: string, type: string): Promise<IMessageDocument> => {
  // `findOneAndUpdate` is going to return the updated document.
  const message: IMessageDocument = (await MessageModel.findOneAndUpdate(
    // I want to update the message where the `_id` matches the `messageId`
    { _id: messageId },
    {
      $set: {
        // i.e here im dynamically updating the `type`.
        // `type` will either be `accepted` or `cancelled` as mentioned on
        // message.schema.ts
        // So if the type is `accepted`, then i want to update the `offer.accepted`
        // property to true. And if the type is `cancelled`, then i want to
        // update the `offer.cancelled` property to true.
        // So this is how i dynamically update a field in an object.
        [`offer.${type}`]: true
      }
    },
    // Here im setting the `new` property to true because i want to return the
    // new updated document, not the old one.
    { new: true }
  )) as IMessageDocument;
  return message;
};

// @ Mark single message as read.
// This method will be used to update the `isRead` property located on the
// `message.schema.ts`
// Im going to add two endpoints. One will be to update `isRead` for just
// one message and then the other will be to update `isRead` for multiple
// messages.
// So this method `markMessageAsRead` will be used just to update one single
// message and then i emit event to Socket.io
const markMessageAsRead = async (messageId: string): Promise<IMessageDocument> => {
  // Here i look for the documents where the `_id` matches the `messageId`
  // and im using here `findOneAndUpdate`
  const message: IMessageDocument = (await MessageModel.findOneAndUpdate(
    { _id: messageId },
    {
      $set: {
        // So here i set the `isRead` for the specific message to true
        isRead: true
      }
    },
    // Here im setting the `new` property to true because i want to return the
    // new updated document, not the old one.
    { new: true }
  )) as IMessageDocument;
  // But here i need to emit the Socket.io event. So i send an event to  socket.io
  // Im setting the event name here to be `message updated`
  socketIOChatObject.emit('message updated', message);
  return message;
};

// @ Mark many or multiple messages as read.
// Method to update `isRead` property for multiple messages!
// `markMultipleMessagesAsRead` or `markManyMessagesAsRead`
// So what this method will do is, it will check for based on the receiver and
// the sender, all the messages for these two users that still has the `isRead`
// property set to false. And then im going to use this `messageId` to return
// the specific message so i can emit it here.
const markManyMessagesAsRead = async (receiver: string, sender: string, messageId: string): Promise<IMessageDocument> => {
  (await MessageModel.updateMany(
    // what are the documents i want to update is, documents where the sender
    // name i.e senderUsername matches sender and receiverUsername matches
    // receiver
    // So i want to only look for document that matches this criteria.
    // So it will skip any documents where the sender name is `sender` and
    // receiver name is `receiver` and the `isRead` property is set to true.
    // It will skip that message.
    { senderUsername: sender, receiverUsername: receiver, isRead: false },
    {
      $set: {
        isRead: true
      }
    },
    // Here im setting the `new` property to true because i want to return the
    // new updated document, not the old one.
    { new: true }
  )) as IMessageDocument;
  // Here i want to return a document where the `_id` matches the `messageId`
  // and then whatever is returned, that is what im going to send to API
  // gateway which is the Client.
  const message: IMessageDocument = (await MessageModel.findOne({ _id: messageId }).exec()) as IMessageDocument;
  socketIOChatObject.emit('message updated', message);
  return message;
};

export {
  createConversation,
  addMessage,
  getConversation,
  getUserConversationList,
  getMessages,
  getUserMessages,
  updateOffer,
  markMessageAsRead,
  markManyMessagesAsRead
};
