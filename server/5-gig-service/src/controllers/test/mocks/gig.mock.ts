import { IAuthPayload, ISellerGig } from '@colson0x1/tradenexus-shared';
import { Response } from 'express';

export const gigMockRequest = (sessionData: IJWT, body: ISellerGig, currentUser?: IAuthPayload | null, params?: IParams) => ({
  session: sessionData,
  body,
  params,
  currentUser
});

export const gigMockResponse = (): Response => {
  const res: Response = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

export interface IJWT {
  jwt?: string;
}

export const authUserPayload: IAuthPayload = {
  id: 9,
  username: 'Stillhome',
  email: 'stillhome@google.com',
  iat: 202502252341
};

export interface IParams {
  username?: string;
}

export const sellerGig: ISellerGig = {
  _id: '1234567890abcdef',
  sellerId: 'a1b2c3d4e5f6g7h8',
  username: 'Stillhome',
  email: 'stillhome@london.com',
  profilePicture: '',
  title: 'Im open for fashion.',
  description: 'World class design at reasonable rates.',
  categories: 'fashion',
  subCategories: ['DIOR', 'CHANEL', 'Louis Vuitton', 'Gucci'],
  tags: ['DIOR', 'CHANEL', 'Louis Vuitton', 'Gucci'],
  price: 800,
  expectedDelivery: '5',
  basicTitle: 'Fashion / Trend.',
  basicDescription: 'Fashion stuff.',
  coverImage: ''
};
