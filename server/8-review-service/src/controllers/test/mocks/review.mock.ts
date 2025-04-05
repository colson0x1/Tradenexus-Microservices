import { IAuthPayload, IReviewDocument } from '@colson0x1/tradenexus-shared';
import { Response } from 'express';

export const reviewMockRequest = (sessionData: IJWT, body: IReviewDocument, currentUser?: IAuthPayload | null, params?: IParams) => ({
  session: sessionData,
  body,
  params,
  currentUser
});

export const reviewMockResponse = (): Response => {
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
  username: 'Stillie',
  email: 'stillhome@me.com',
  iat: 202503251400
};

export interface IParams {
  username?: string;
}

export const reviewDocument: IReviewDocument = {
  _id: '89asdasdal64sssfed524asde3xasd1s8',
  gigId: 'casdad8asalfed52asdasd88sjslsks9a0',
  reviewerId: 'casdad8asalfed52asdasd88sjslsks9a0',
  sellerId: 'casdad8asalfed52asdasd88sjslsks9a0',
  review: 'The design is absolutely awesome!',
  reviewerImage: 'https://placehold.co/600x400',
  rating: 5,
  orderId: '80asdjs0skoajslwkzoierejakaow9a1',
  createdAt: '2025-04-05T16:44:00.000Z',
  reviewerUsername: 'Stillie',
  country: 'UK',
  reviewType: 'seller-review'
};
