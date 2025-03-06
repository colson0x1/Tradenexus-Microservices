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
    $or: [{ senderUsername: username }, { senderUsername: username }]
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

export { createConversation, addMessage, getConversation, getUserConversationList };
