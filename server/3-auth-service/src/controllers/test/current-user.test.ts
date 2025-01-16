// What im going to test is, test what happens if `getAuthUserById()` returns
// the existing user and what happens if it doesnt return the existing user.
// So if existingUser from current-user.ts returns an object of type IAuthDocument,
// then we send message 'Authenticated user' and then we send the user object.
// Otherwise if it does not then user is going to be null as in the
// `auth/src/controllers/current-user.ts`
// And then later, test sendEmail()

import { Request, Response } from 'express';
// Here i want to use it to mock the specific method that i actually need.
import * as auth from '@auth/services/auth.service';
import { authMock, authMockRequest, authMockResponse, authUserPayload } from '@auth/controllers/test/mocks/auth.mock';
import { read } from '@auth/controllers/current-user';

// Im not going to call this actual `getAuthUserById()` method from current-user.ts,
// so im going to mock it and then mock the response
// So here im mocking the complete service.
jest.mock('@auth/services/auth.service');
// Mocking shared library
jest.mock('@colson0x1/tradenexus-shared');
// Mock producer because inside current-user.ts, it is used there i.e
// `publishDirectMessage()`
// We dont want to make a actual request or publish an actual message, so I
// mock the producer.
jest.mock('@auth/queues/auth.producer');
// Mock Elasticsearch
jest.mock('@elastic/elasticsearch');

// For just testing
const USERNAME = 'colson';
const PASSWORD = 'stillhome';

describe('CurrentUser', () => {
  // Since we're mocking
  beforeEach(() => {
    // Before each test block is executed, we reset all mocks
    jest.resetAllMocks();
  });

  afterEach(() => {
    // After each test block, clear all mocks
    jest.clearAllMocks();
  });

  // First method that i want to test is `read` from src/controllers/current-user.ts
  // Im creating a describe block here so that it will just group it separately
  // So inside read method, im going to test two case - fisrt is when the
  // getAuthUserById() method return an existing user and the other case will
  // be when it doesn't return an existing user. We want to see what the
  // response will look like
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

      // Now we need to spy on this fn `getAuthUserById` from current-user.ts
      // We dont want to call the actual function i.e the actual implementation.
      // We only just want to mock it.
      // And since i imported * as auth above, so here.
      // Here, the reson im using mockResolvedValue is because this fn
      // i.e getAuthUserById returns a promise. So here we're resolving the
      // response. And what is the response? We want to resolve it to return
      // authMock.
      // So when there is an existing user, it reutrns an object of type
      // IAuthDocument and that is what we already have there in auth.mock.ts
      // inside `authMock`
      // So this fn getAuthUserById, once this method is called in the test, it
      // will return authMock because we're mocking the value i.e we are not
      // calling the actual implementation.
      jest.spyOn(auth, 'getAuthUserById').mockResolvedValue(authMock);
      await read(req, res);

      // Expectation
      // We want to see the response of our res.status and json. So we expect
      // this status inside current-user.ts to be 200 and we expect the json
      // to have this object with message 'Authenticated user' and user property.
      // That is what we expect this test here to return.
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Authenticated user',
        user: authMock
      });
      // So this is what we expect this fn to return if this `getAuthUserById()`
      // from current-user.ts returns an actual existing user document.
    });

    it('should return empty user', async () => {
      const req: Request = authMockRequest({}, { username: USERNAME, password: PASSWORD }, authUserPayload) as unknown as Request;
      const res: Response = authMockResponse();

      // So if this `getAuthUserById()` does not find any existing user, it
      // returns an empty user. So here on mockResolvedValue, im passing an
      // empty object indicating that it didnt found any existing user i.e {}.
      // So here what is happening is, we're returning an empty object from
      // getAuthUserById. So if thats the case, then the user will be null
      // as in current-user.ts
      jest.spyOn(auth, 'getAuthUserById').mockResolvedValue({} as never);
      await read(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Authenticated user',
        // Here if we add something other than null for user, then we're going
        // to get an error on test
        user: null
      });
    });
  });
});
