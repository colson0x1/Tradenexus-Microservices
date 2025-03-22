import { IAuthPayload, IMessageDocument } from '@colson0x1/tradenexus-shared';
import { Response } from 'express';

export const chatMockRequest = (sessionData: IJWT, body: IMessageDocument, currentUser?: IAuthPayload | null, params?: IParams) => ({
  session: sessionData,
  body,
  params,
  currentUser
});

export const chatMockResponse = (): Response => {
  const res: Response = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

export interface IJWT {
  jwt?: string;
}

export const authUserPayload: IAuthPayload = {
  id: 2,
  username: 'stillhome',
  email: 'stillhome@me.com',
  iat: 202503221723
};

export interface IParams {
  username?: string;
}

export const messageDocument: IMessageDocument = {
  conversationId: '80263c14648fed5246e322e8',
  body: 'Things are chilly at the moment',
  file: '',
  fileType: 'png',
  fileSize: '2MB',
  fileName: 'tester',
  gigId: '30263f14648fed5246e322a9',
  sellerId: '30263f14648fed5246e322a9',
  buyerId: '20263f14643fed4346e322e8',
  senderUsername: 'stillie',
  senderPicture: '',
  receiverUsername: 'colson',
  receiverPicture: '',
  isRead: false,
  hasOffer: false,
  offer: undefined
};
