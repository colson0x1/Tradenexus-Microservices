// What im going to do here is check if the `validate` from create controller
// throws an error. And if that method throws an error, i make sure that i have
// this BadRequestError called. And if the `uploads` fails, i again will make sure
// that it throws BadRequestError.
// And then im going to test to check that this method `createConversation`
// is called. So im goign to check if hasConversation is not available , then
// im going to make sure that this `createConversation` method is called. If
// its available, it should be skipped.
// And then i check `addMessage` method that its called. And if everything goes
// through, then check that im sending the correct JSON response.

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import * as chatService from '@chat/services/message.service';
import { messageSchema } from '@chat/schemes/message';
import * as helper from '@colson0x1/tradenexus-shared';
import { chatMockRequest, chatMockResponse, authUserPayload, messageDocument } from '@chat/controllers/test/mocks/chat.mock';
import { message } from '@chat/controllers/create';

jest.mock('@chat/services/message.service');
jest.mock('@colson0x1/tradenexus-shared');
jest.mock('@chat/schemes/message');
jest.mock('@elastic/elasticsearch');

describe('Chat Controller', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    delete messageDocument.hasConversationId;
    jest.clearAllMocks();
  });

  describe('message method', () => {
    it('should throw an error for invalid schema data', async () => {
      const req: Request = chatMockRequest({}, messageDocument, authUserPayload) as unknown as Request;
      const res: Response = chatMockResponse();
      jest.spyOn(messageSchema, 'validate').mockImplementation((): any =>
        Promise.resolve({
          error: {
            name: 'ValidationError',
            isJoi: true,
            details: [{ message: 'This is an error message' }]
          }
        })
      );

      message(req, res).catch(() => {
        expect(helper.BadRequestError).toHaveBeenCalledWith('This is an error message', 'Create message() method');
      });
    });

    it('should throw file upload error', async () => {
      const req: Request = chatMockRequest({}, messageDocument, authUserPayload) as unknown as Request;
      const res: Response = chatMockResponse();
      jest.spyOn(messageSchema, 'validate').mockImplementation((): any => Promise.resolve({ error: {} }));
      jest.spyOn(helper, 'uploads').mockImplementation((): any => Promise.resolve({ public_id: '' }));

      message(req, res).catch(() => {
        expect(helper.BadRequestError).toHaveBeenCalledWith('File upload error. Try again', 'Create message() method');
      });
    });

    it('should call createConversation method', async () => {
      messageDocument.hasConversationId = false;
      const req: Request = chatMockRequest({}, messageDocument, authUserPayload) as unknown as Request;
      const res: Response = chatMockResponse();
      jest.spyOn(messageSchema, 'validate').mockImplementation((): any => Promise.resolve({ error: {} }));
      jest.spyOn(helper, 'uploads').mockImplementation((): any => Promise.resolve({ public_id: '12345678' }));
      jest.spyOn(chatService, 'createConversation');

      await message(req, res);
      // If i want, i can check that `createConversation` should be called with
      // specific properties defined like `${req.body.conversationId}`,
      // `${messageData.senderUsername}`, and `${messageData.receiverUsername}`.
      expect(chatService.createConversation).toHaveBeenCalledTimes(1);
    });

    it('should call addMessage method', async () => {
      messageDocument.hasConversationId = true;
      const req: Request = chatMockRequest({}, messageDocument, authUserPayload) as unknown as Request;
      const res: Response = chatMockResponse();
      jest.spyOn(messageSchema, 'validate').mockImplementation((): any => Promise.resolve({ error: {} }));
      jest.spyOn(helper, 'uploads').mockImplementation((): any => Promise.resolve({ public_id: '12345678' }));
      jest.spyOn(chatService, 'addMessage');

      await message(req, res);
      expect(chatService.addMessage).toHaveBeenCalledTimes(1);
    });

    it('should return correct json response', async () => {
      const req: Request = chatMockRequest({}, messageDocument, authUserPayload) as unknown as Request;
      const res: Response = chatMockResponse();
      jest.spyOn(messageSchema, 'validate').mockImplementation((): any => Promise.resolve({ error: {} }));
      jest.spyOn(helper, 'uploads').mockImplementation((): any => Promise.resolve({ public_id: '12345678' }));

      await message(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Message added',
        conversationId: messageDocument.conversationId,
        messageData: messageDocument
      });
    });
  });
});
