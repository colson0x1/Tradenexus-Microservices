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
import * as helper from '@colson0x1/tradenexus-shared';
import { authMock, authMockRequest, authMockResponse, authUserPayload } from '@auth/controllers/test/mocks/auth.mock';
import { read, resendEmail } from '@auth/controllers/current-user';
import { Sequelize } from 'sequelize';
import { config } from '@auth/config';

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

// RESOLVE: Jest Async Error for test (Approach 2)
// Error -> `Reference Error. You are trying to import the file after the Jest
// environment has been torn down.`
// Approach 2
// i.e create an actual connection but the connection will not access the
// database.
// I used approach 2 here since it doesnt affect the database.
let mockConnection: Sequelize;

describe('CurrentUser', () => {
  // Since we're mocking
  beforeEach(async () => {
    // Before each test block is executed, we reset all mocks
    jest.resetAllMocks();
    mockConnection = new Sequelize(config.MYSQL_DB!, {
      dialect: 'mysql',
      logging: false,
      dialectOptions: {
        multipleStatements: true
      }
    });
    // So that `AuthModel.sync({})` inside auth.schema.ts was trying to create
    // the table every time we run the test. So here we're telling it to set
    // the force to true. We drop the table. We delete the table. SO before
    // every test, delete the table. But its not going to affect the table we
    // already have in the database.
    // So before each block, we drop the table.
    await mockConnection.sync({ force: true });
  });

  afterEach(async () => {
    // After each test block, clear all mocks
    jest.clearAllMocks();
    // Close the connection
    // After each block, we close the connection.
    await mockConnection.close();
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

  // @ Resend email test
  // We're going to have three cases. First is, if this method `getUserByEmail()`
  // doesn't return any value or any object. Second is if it returns an object.
  // And third is, test if this method i.e `updateVerifyEmailField()` was
  // actually called when we call `resendEmail()`
  // @ 1st test case
  describe('resendEmail method', () => {
    // I want to test this case if this `getUserByEmail` that is located inside
    // `resendEmail()` method from current-user.ts, so if this fn does not
    // return any object, I expect it to call this `BadRequestError()`
    it('should call BadRequestError for invalid email', async () => {
      const req: Request = authMockRequest({}, { username: USERNAME, password: PASSWORD }, authUserPayload) as unknown as Request;
      const res: Response = authMockResponse();

      // Its not going to return an actual object. Its going to return an
      // empty object.
      jest.spyOn(auth, 'getUserByEmail').mockResolvedValue({} as never);

      // Now because we want to check for error case, we can pass this inside
      // a catch block. resendEmail fn is a promise. so we have access to
      // .then() and .catch().
      resendEmail(req, res).catch(() => {
        // I want to expecr or check that BadRequestError was called with this
        // properties i.e from resendEmail() inside curren-user.ts
        // `BadRequestError('Email is invalid', 'CurrentUser resentEmail() method error')`
        // So if there's an error, if this `getAuthUserById()` doesn't return
        // an object, then we expect BadRequestError to have been called with
        // this properties listed.
        expect(helper.BadRequestError).toHaveBeenCalledWith('Email is invalid', 'CurrentUser resentEmail() method error');
      });
    });

    // @ 2nd test case
    // The second test case is we want to make sure that this `updateVerifyEmailField()`
    // was called.
    it('should call updateVerifyEmailField method', async () => {
      const req: Request = authMockRequest({}, { username: USERNAME, password: PASSWORD }, authUserPayload) as unknown as Request;
      const res: Response = authMockResponse();

      jest.spyOn(auth, 'getUserByEmail').mockResolvedValue(authMock);

      await resendEmail(req, res);

      // We expect that at least this `updateVerifyEmailField` method was called
      expect(auth.updateVerifyEmailField).toHaveBeenCalled();
    });

    // @ 3rd test case
    // It should call the `getAuthUserById()` i.e
    // `const updatedUser = await getAuthUserById(parse(userId));`
    // and then also the json respon should have this properties i.e
    // `res.status(StatusCodes.OK).json({ message: 'Email verification sent', user: updatedUser })`
    // i.e { message: 'Email verification sent', user: updatedUser }
    it('should return authenticated user', async () => {
      const req: Request = authMockRequest({}, { username: USERNAME, password: PASSWORD }, authUserPayload) as unknown as Request;
      const res: Response = authMockResponse();

      jest.spyOn(auth, 'getUserByEmail').mockResolvedValue(authMock);
      jest.spyOn(auth, 'getAuthUserById').mockResolvedValue(authMock);
      await resendEmail(req, res);

      expect(auth.updateVerifyEmailField).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      // Here user should be whatever this `getAuthUserById` returns above
      // which is authMock i.e jest.spyOn(auth, 'getAuthUserById').mockResolvedValue(authMock);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email verification sent', user: authMock });
    });
  });
});
