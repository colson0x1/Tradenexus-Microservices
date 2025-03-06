import { IConversationDocument } from '@colson0x1/tradenexus-shared';
import { model, Model, Schema } from 'mongoose';

// This is just the contents of the conversation schema.
const conversationSchema: Schema = new Schema({
  // Even though MongoDB will will create the `_id` property, im going to
  // use this `conversationId` as the id for the conversation. So what im
  // going to be using to get the data or messages for a particular user is
  // going to be this `conversationId`.
  conversationId: { type: String, required: true, unique: true, index: true },
  // And then im going to have the sender name.
  senderUsername: { type: String, required: true, index: true },
  receiverUsername: { type: String, required: true, index: true }
});

// collection name is `Conversation`
const ConversationModel: Model<IConversationDocument> = model<IConversationDocument>('Conversation', conversationSchema, 'Conversation');
export { ConversationModel };
