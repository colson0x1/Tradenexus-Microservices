// For conversation, i'll just have one document for a particular seller
// and buyer. So the conversation will have just one document. Once that is
// created, it'll only just be using the conversation id. Im not going to
// recreate it every time a message is sent.

import { ConversationModel } from '@chat/models/conversation.schema';
import { MessageModel } from '@chat/models/message.schema';
import { publishDirectMessage } from '@chat/queues/message.producer';
import { chatChannel, socketIOChatObject } from '@chat/server';
import { IMessageDetails, IMessageDocument, lowerCase } from '@colson0x1/tradenexus-shared';

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
