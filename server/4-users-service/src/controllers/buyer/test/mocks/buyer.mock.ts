// There are libraries that we can use to mock HTTP request and response for
// express and related to express but instead I decided to set up my own
// mocking functions.
// So Im going to mock the HTTP request, mock the response and then mock some
// data that will be sent or received.

import { IAuthPayload, IBuyerDocument } from '@colson0x1/tradenexus-shared';
import { Response } from 'express';

// @buyerMockRequest method
// When sending a request, we need some object. And in the object, we need
// session data and we need a body i.e if we're sending a POST request, we
// usually send data in the req.body. Also we want to set the currentUser
// and then params i.e req.params.username like that.
// So im mocking what we usually have in request coming from express.
/* export const buyerMockRequest = (sessionData: IJWT, body: IAuthMock, currentUser?: IAuthPayload | null, params?: unknown) => ({ */
// I can remove `body: IAuthMock` because the buyer only has GETs so we don't
// need `req.body`. So im only passing a request params or whatever i need to
// pass but i dont need any request body.
// i.e buyer's request are only GET requests so there is no `req.body`. Im only
// getting from `req.currentUser` or `req.params` as in `src/controllers/buyer/get.ts`
export const buyerMockRequest = (sessionData: IJWT, currentUser?: IAuthPayload | null, params?: IParams) => ({
  // Here we're mocking what we have inside request object i.e mocking whats
  // inside `req: Request`
  // Inside request object, we have the sesion object property and its going
  // to be type of sessionData
  session: sessionData,
  params,
  currentUser
});

// @buyerMockResponse method
// What im doing in this fn is just to mock what I actually need. When im
// sending status code, i use res.status so im mocking it as a jest fn and
// returning this response object i.e `res`. And then, im doing it same for
// json and returning res.
export const buyerMockResponse = (): Response => {
  const res: Response = {} as Response;
  // The two properties that we need mostly are `status` and `json`
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// @ Interface for JWT
// In our session, we have req.session.jwt
export interface IJWT {
  jwt?: string;
}

export interface IParams {
  username?: string;
}

// Payload that we add when we sign the token
// i.e the payload we're passing to the signToken from auth.service.ts
// So that is what im mocking the resposne right here
export const authUserPayload: IAuthPayload = {
  id: 1,
  username: 'colson',
  email: 'colson@google.com',
  iat: 202501162240
};

// Information that is returned when we create the user
export const buyerDocument: IBuyerDocument = {
  _id: '1234567890cols',
  username: 'colson',
  email: 'colson@google.com',
  country: 'Nepal',
  profilePicture: '',
  isSeller: false,
  purchasedGigs: [],
  // random date
  createdAt: '2025-02-18T15:00:00.123Z'
};
