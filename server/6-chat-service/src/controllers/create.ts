// This is going to be the controller that will handle creating the message

import crypto from 'crypto';

import { messageSchema } from '@chat/schemes/message';
import { BadRequestError, IMessageDocument, uploads } from '@colson0x1/tradenexus-shared';
import { Request, Response } from 'express';
import { UploadApiResponse } from 'cloudinary';
import { addMessage, createConversation } from '@chat/services/message.service';
import { StatusCodes } from 'http-status-codes';

// or messages that are sent.
const message = async (req: Request, res: Response): Promise<void> => {
  // The first thing that i have to do is to validate the data that is coming
  // here
  const { error } = await Promise.resolve(messageSchema.validate(req.body));
  if (error?.details) {
    // `details` is always an array and then i get the `message` property
    // So if there's an error with the validation based on the message schema,
    // then i get this error message thrown.
    throw new BadRequestError(error.details[0].message, 'Create message() method');
  }
  let file: string = req.body.file;
  // Its better to create this random characters and crypto uses in a helper
  // library instead
  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  const randomCharacters: string = randomBytes.toString('hex');
  let result: UploadApiResponse;
  // If the file exists
  if (file) {
    // So if the message contains a file and if the file type is the zip file
    // As in the message.schema.ts, i have the properties, `file`,`fileType`,
    // `fileSize`, and `fileName`. Im going to send those from the client from
    // the frontend
    // So if the filetype is equal to zip. So if maybe the buyer or the sender
    // is sending a zip file in the message, then what im going to do is, i
    // upload. i generate a random public key for the zip file.
    // So this `${randomCharacters}.zip` is going to be the key that im using
    // or the public id that im using for this particular zip file.
    // Else if its just a regular file, then i upload it so i just call  await
    // and then upload the file without the public key or without the public id.
    result = (req.body.fileType === 'zip' ? await uploads(file, `${randomCharacters}.zip`) : await uploads(file)) as UploadApiResponse;
    if (!result.public_id) {
      throw new BadRequestError('File upload error. Try again', 'Create message() method');
    }
    // Now the next thing is, im going to change the value of this `file`
    file = result?.secure_url;
  }
  const messageData: IMessageDocument = {
    conversationId: req.body.conversationId,
    body: req.body.body,
    file,
    fileType: req.body.fileType,
    fileSize: req.body.fileSize,
    fileName: req.body.fileName,
    gigId: req.body.gigId,
    buyerId: req.body.buyerId,
    sellerId: req.body.sellerId,
    senderUsername: req.body.senderUsername,
    senderPicture: req.body.senderPicture,
    receiverUsername: req.body.receiverUsername,
    receiverPicture: req.body.receiverPicture,
    isRead: req.body.isRead,
    hasOffer: req.body.hasOffer,
    offer: req.body.offer
    // Im going to add this `createdAt` as a default in message.schema.ts
    // because its going to conflict with unit test for create controller
    /* createdAt: new Date() */
  };
  // Now if this `hasConversationId` property is true then i dont want to
  // create the new conversation but if its false, then i want to create
  // conversation in the database.
  if (!req.body.hasConversationId) {
    // So here i assume that there is not conversation that has been created
    // in the database.
    await createConversation(`${req.body.conversationId}`, `${messageData.senderUsername}`, `${messageData.receiverUsername}`);
  }
  await addMessage(messageData);
  res.status(StatusCodes.OK).json({ message: 'Message added', conversationId: req.body.conversationId, messageData });
};

export { message };
