import { getConversation, getMessages, getUserConversationList, getUserMessages } from '@chat/services/message.service';
import { IConversationDocument, IMessageDocument } from '@colson0x1/tradenexus-shared';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

// @ Get conversation
const conversation = async (req: Request, res: Response): Promise<void> => {
  const { senderUsername, receiverUsername } = req.params;
  const conversations: IConversationDocument[] = await getConversation(senderUsername, receiverUsername);
  res.status(StatusCodes.OK).json({ message: 'Chat Conversation', conversations });
};

// @ Method to get messages based on the sender name and the receiver name
const messages = async (req: Request, res: Response): Promise<void> => {
  const { senderUsername, receiverUsername } = req.params;
  const messages: IMessageDocument[] = await getMessages(senderUsername, receiverUsername);
  res.status(StatusCodes.OK).json({ message: 'Chat messages', messages });
};

// @ Method to get the conversation list. The one that im going to use in the
// chat list component in frontend.
// chatList or conversationList
const conversationList = async (req: Request, res: Response): Promise<void> => {
  const { username } = req.params;
  const messages: IMessageDocument[] = await getUserConversationList(username);
  res.status(StatusCodes.OK).json({ message: 'Conversation list', conversation: messages });
};

// @ Method to get the messages by conversation id
const userMessages = async (req: Request, res: Response): Promise<void> => {
  const { conversationId } = req.params;
  const messages: IMessageDocument[] = await getUserMessages(conversationId);
  res.status(StatusCodes.OK).json({ message: 'Chat messages', messages });
};

export { conversation, messages, conversationList, userMessages };
