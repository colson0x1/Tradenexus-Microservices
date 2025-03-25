import { IAuthPayload, IOrderDocument } from '@colson0x1/tradenexus-shared';
import { Response } from 'express';

export const orderMockRequest = (sessionData: IJWT, body: IOrderDocument, currentUser?: IAuthPayload | null, params?: IParams) => ({
  session: sessionData,
  body,
  params,
  currentUser
});

export const orderMockResponse = (): Response => {
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

export const orderDocument: IOrderDocument = {
  offer: {
    gigTitle: '',
    price: 20,
    description: '',
    deliveryInDays: 2,
    oldDeliveryDate: '2025-03-25T14:00:00.001Z',
    newDeliveryDate: '2025-03-26T14:00:00.001Z',
    accepted: false,
    cancelled: false,
    reason: ''
  },
  gigId: '86a263fd4648fcd9246e382s8',
  sellerId: '86a263fd4648fcd9246e382s8',
  sellerUsername: 'Colson',
  sellerImage: 'https://placehold.co/600x400',
  sellerEmail: 'colson@test.com',
  gigCoverImage: 'https://placehold.co/600x400',
  gigMainTitle: 'World class fashion designer at your service.',
  gigBasicTitle: 'Fashion & Design',
  gigBasicDescription: 'Any apparel you desire for different seasons, parties and ceremonies.',
  buyerId: '98qwe8w648fedsss432s8',
  buyerUsername: 'Stillie',
  buyerEmail: 'stillhome@test.com',
  buyerImage: 'https://placehold.co/600x400',
  status: 'in progress',
  orderId: '890asd8as9d8a7s0sasdad909',
  invoiceId: 'BLESSED1234567890',
  quantity: 1,
  price: 20,
  requestExtension: {
    originalDate: '2025-03-25T14:00:00.001Z',
    newDate: '2025-03-26T14:00:00.001Z',
    days: 1,
    reason: 'Give me a little time to make the design world class.',
    deliveryDateUpdate: '2025-03-26T14:00:00.001Z'
  },
  serviceFee: 0,
  requirements: '',
  approved: false,
  cancelled: false,
  delivered: false,
  approvedAt: '',
  deliveredWork: [],
  dateOrdered: '',
  events: {
    placeOrder: '',
    requirements: '',
    orderStarted: '',
    deliveryDateUpdate: '',
    orderDelivered: '',
    buyerReview: '',
    sellerReview: ''
  }
};
