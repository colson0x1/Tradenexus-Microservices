import { message } from '@chat/controllers/create';
import { conversation, conversationList, messages, userMessages } from '@chat/controllers/get';
import { markMultipleMessages, markSingleMessage, offer } from '@chat/controllers/update';
import express, { Router } from 'express';

const router: Router = express.Router();

const messageRoutes = (): Router => {
  // @ Route to get the conversation using the senderUsername and receiverUsername
  router.get('/conversation/:senderUsername/:receiverUsername', conversation);
  // @ Route to get the messages or the conversation list using the username
  // here its `conversations` because im gerting the list
  router.get('/conversations/:username', conversationList);
  // @ Route to get messages based on the sender username and receiver username
  router.get('/:senderUsername/:receiverUsername', messages);
  // @ Route to get the messages by the conversation id
  router.get('/:conversationId', userMessages);

  // @ POST routes to create
  router.post('/', message);

  // @ PUT routes to update
  router.put('/offer', offer);
  router.put('/mark-as-read', markSingleMessage);
  router.put('/mark-multiple-as-read', markMultipleMessages);

  return router;
};

export { messageRoutes };
