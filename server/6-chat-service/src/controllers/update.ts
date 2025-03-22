import { markManyMessagesAsRead, markMessageAsRead, updateOffer } from '@chat/services/message.service';
import { IMessageDocument } from '@colson0x1/tradenexus-shared';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

const offer = async (req: Request, res: Response): Promise<void> => {
  const { messageId, type } = req.body;
  const message: IMessageDocument = await updateOffer(messageId, type);
  // Here im going to send the `message` that is returned but the key, im
  // going to  call it `singleMessage`
  // So once i update the property that i need to update which is in the offer
  // object, i get the the new updated document i.e `message` and then i send it
  // with this key `singleMessage`
  res.status(StatusCodes.OK).json({ message: 'Message updated', singleMessage: message });
};

// Method to update multiple messages
const markMultipleMessages = async (req: Request, res: Response): Promise<void> => {
  const { messageId, senderUsername, receiverUsername } = req.body;
  await markManyMessagesAsRead(receiverUsername, senderUsername, messageId);
  res.status(StatusCodes.OK).json({ message: 'Messages marked as read' });
};

const markSingleMessage = async (req: Request, res: Response): Promise<void> => {
  const { messageId } = req.body;
  const message: IMessageDocument = await markMessageAsRead(messageId);
  res.status(StatusCodes.OK).json({ message: 'Message marked as read', singleMessage: message });
};

export { offer, markMultipleMessages, markSingleMessage };
