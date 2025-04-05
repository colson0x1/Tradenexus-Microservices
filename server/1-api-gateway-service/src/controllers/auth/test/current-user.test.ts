import { Request, Response } from 'express';
import { authMock, authMockRequest, authMockResponse, authUserPayload } from '@gateway/controllers/auth/test/mocks/auth.mock';
import * as socketServer from '@gateway/server';
import { authService } from '@gateway/services/api/auth.service';
import { Server } from 'socket.io';
import { AxiosResponse } from 'axios';
import { CurrentUser } from '@gateway/controllers/auth/current-user';
import { GatewayCache } from '@gateway/redis/gateway.cache';

jest.mock('@colson0x1/tradenexus-shared');
jest.mock('@gateway/services/api/auth.service');
jest.mock('@gateway/redis/gateway.cache');
jest.mock('@gateway/server');
jest.mock('@elastic/elasticsearch');

// For just testing
const USERNAME = 'colson';
const PASSWORD = 'stillhome';

// So what i want to mock is, this `socketIO` object used in `getLoggedInUsers()`
// inside `current-user.ts`. So in the `getLoggedInUsers()` and `removeLoggedInUser()`,
// im using `socketIO`, so i need to mock this.
// Here i'll first pass socketServer.
// In JavaScript, if i want to add a property to an object, i can do it this way.
// So this is how i define properties inside an object. Probably i want to do
// it on the fly.
Object.defineProperties(socketServer, {
  // And i'll define this `socketIO` object and set the value.
  socketIO: {
    value: new Server(),
    writable: true
  }
});

describe('CurrentUser', () => {
  // Since we're mocking
  beforeEach(async () => {
    // Before each test block is executed, we reset all mocks
    jest.resetAllMocks();
  });

  afterEach(async () => {
    // After each test block, clear all mocks
    jest.clearAllMocks();
  });

  // Now im going to test the `read` method from current-user.ts. Im going to
  // spy on this `getCurrentUser()` method, return what it expects and then
  // i check the status code and JSON matches whatever i have there.
  describe('read method', () => {
    it('should return authenticated user', async () => {
      // Inside authMockRequest, pass what we actually need. Im passing session
      // as an empty object
      // Since currentUser param is optional so if we dont want to set then,
      // we pass `null` as argument here but as i've mocked for currentUser.
      // Its the authUserPayload for currentUser.
      // Im leaving `params` since its optional.
      const req: Request = authMockRequest({}, { username: USERNAME, password: PASSWORD }, authUserPayload) as unknown as Request;
      // Now that i have the request, now setting response as well
      const res: Response = authMockResponse();

      // Since this `getCurrentUser` method is returning an axios response
      // in gateway current-user.ts, the information i need is inside this
      // `data` object. So this method will return an object with data property.
      // And inside the data, i expect it to have a message and a user.
      jest
        .spyOn(authService, 'getCurrentUser')
        .mockResolvedValue({ data: { message: 'Current user data', user: authMock } } as unknown as AxiosResponse);

      // Now calling `currentUser`
      await CurrentUser.prototype.read(req, res);

      // Expectation
      // I expect it to have status code to be 200 and the message to match
      // whatever i passed there above while spying on `getCurrentUser`.
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Current user data',
        user: authMock
      });
    });

    // Now im going to spy the `resendEmail` and i expect the JSON to have
    // expected message and the user.
    describe('resendEmail method', () => {
      it('should return correct response', async () => {
        const req: Request = authMockRequest({}, { username: USERNAME, password: PASSWORD }, authUserPayload) as unknown as Request;
        const res: Response = authMockResponse();

        // Here i want to mock the `resendEmail`
        jest
          .spyOn(authService, 'resendEmail')
          .mockResolvedValue({ data: { message: 'Email sent successfully.', user: authMock } } as unknown as AxiosResponse);

        await CurrentUser.prototype.resendEmail(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Email sent successfully.',
          user: authMock
        });
      });
    });

    // The next test i want to run is this `getLoggedInUsers` method. So for this
    // `getLoggedInUsers`, im going  to mock this `getLoggedInUsersFromCache`.
    // So i expect it to return a string array i.e `response`. And then im going
    // to mock this `.emit` method and check if this `socketIO.emit` method was
    // called. In addition to it, check the JSON has the correct response.
    describe('getLoggedInUsers method', () => {
      it('should return correct response', async () => {
        const req: Request = authMockRequest({}, { username: USERNAME, password: PASSWORD }, authUserPayload) as unknown as Request;
        const res: Response = authMockResponse();

        // For this, im not getting the logged in users from the `authService`.
        // Im getting it from the cache, the `gatewayCache`.
        jest
          .spyOn(GatewayCache.prototype, 'getLoggedInUsersFromCache')
          // It expects a string array. Therefore im adding usernames. So it
          // returns value of this `getLoggedInUsersFromCache` as an array.
          .mockResolvedValue(['colson', 'stillhome'] as unknown as string[]);
        // Now spying on this `socketIO.emit`. I have already defined it on the
        // top of this file. So i will just spy on `emit` method.
        jest.spyOn(socketServer.socketIO, 'emit');

        // And then i call this actual method `getLoggedInUsers`.
        await CurrentUser.prototype.getLoggedInUsers(req, res);
        // I want to check that this `socketIO.emit` was called. So i expect
        // it to be called with `online` event and the `response`.
        // The `response` is whatever this `getLoggedInUsersFromCache` method
        // returns above.
        // So this is what i expect the `socketIO.emit` method to be called with.
        expect(socketServer.socketIO.emit).toHaveBeenCalledWith('online', ['colson', 'stillhome']);

        // And then also, i expect the status to be 200 and the JSON should
        // match whatever is there in `current-user.ts`.
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'User is online' });
      });
    });

    describe('removeLoggedInUser method', () => {
      it('should return correct response', async () => {
        /* const req: Request = authMockRequest({}, { username: USERNAME, password: PASSWORD }, authUserPayload) as unknown as Request; */
        // This test will fail if i dont provide a params object. Because in
        // the current-user controller, it needs a params object i.e `req.params.username`.
        // And on the `auth.mock.ts` inside the `authMockRequest`, the last
        // property in there is usually a params object.
        // So i have to define params here because this method `removeLoggedInUser`
        // requires a param.
        const req: Request = authMockRequest({}, { username: USERNAME, password: PASSWORD }, authUserPayload, {
          username: 'colson'
        }) as unknown as Request;
        const res: Response = authMockResponse();

        // Now i will remove one of these users.
        jest.spyOn(GatewayCache.prototype, 'removeLoggedInUserFromCache').mockResolvedValue(['colson'] as unknown as string[]);
        jest.spyOn(socketServer.socketIO, 'emit');

        await CurrentUser.prototype.removeLoggedInUser(req, res);
        // And in this case, i expect `socketIO.emit` to be called with `online`
        // event and then an array with just one item. And the text should be
        // `User is offline`.
        expect(socketServer.socketIO.emit).toHaveBeenCalledWith('online', ['colson']);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'User is offline' });
      });
    });
  });
});
