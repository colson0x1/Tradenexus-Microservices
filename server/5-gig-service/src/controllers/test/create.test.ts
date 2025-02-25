/* @ Test for `gig/src/controllers/create.ts` i.e create gig controller */
// Im going to test this method `gigCreate` and check what happens if the
// `gigCreateSchema` validation fails, what happens if the upload fails i.e
// `result` of type UploadApiResponse and whats going to be the response if
// everything is successful. So those are just the cases im going to check.
// So im going to check, what happens if the validation fails, if upload fails
// and then the actual response.

/* eslint-disable @typescript-eslint/no-explicit-any */
import { gigCreate } from '@gig/controllers/create';
import { BadRequestError } from '@colson0x1/tradenexus-shared';
import { Request, Response } from 'express';
import * as helper from '@colson0x1/tradenexus-shared';
import * as gigService from '@gig/services/gig.service';
import { gigCreateSchema } from '@gig/schemes/gig';
import { authUserPayload, gigMockRequest, gigMockResponse, sellerGig } from '@gig/controllers/test/mocks/gig.mock';

// mock the gig service
jest.mock('@gig/services/gig.service');
// mock the helpers
jest.mock('@colson0x1/tradenexus-shared');
// mock gig schemes
jest.mock('@gig/schemes/gig');
// mock elasticsearch. In mocking this gig elasticsearch because of this
// method `getDocumentCount()` from `gig/src/controllers/create.ts`
jest.mock('@gig/elasticsearch');
jest.mock('@elastic/elasticsearch');

describe('Gig controller', () => {
  // Create beforeEach and afterEach to clear the mocks
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // So the first part of the test is, i want to test what happens if this
  // `.validate` method in `src/controllers/create.ts` inside `gigCreate()`
  // returns an error. I want to make sure that new BadRequestError was actualy
  // called. So im going to mock this `validate` method and then return an error.
  describe('gig method', () => {
    it('should throw an error for invalid schema data', () => {
      // Here im passing `sellerGig` object as the body
      const req: Request = gigMockRequest({}, sellerGig, authUserPayload) as unknown as Request;
      const res: Response = gigMockResponse();
      // Now i want to mock this `validate` method so that it returns an error object
      // Here im spying the schema, the `gigCreateSchema` and inside this schema,
      // i've this `validate` method which i want to mock.
      jest.spyOn(gigCreateSchema, 'validate').mockImplementation((): any =>
        Promise.resolve({
          error: {
            // This name `ValidationError` is coming from validation error interface
            // inside the index.d.ts. Same as the `isJoy` and `details`
            name: 'ValidationError',
            isJoi: true,
            details: [{ message: 'This is an error message' }]
          }
        })
      );

      // Inorder to test this, i need to import the `gigCreate` method.
      // Also, because it is an error, i need to use the catch block.
      gigCreate(req, res).catch(() => {
        // I want to get this `BadRequestError` from `tradenexus-shared`
        // So if this `validate` method returns an error, I expect that the
        // `BadRequestError` should be called with whatever is passed as the
        // message and this `Create gig() method`.
        expect(BadRequestError).toHaveBeenCalledWith('This is an error message', 'Create gig() method');
      });
    });

    // Another test to make sure, if that `validate` method return successful
    // and then the next, `upload` method returns an error.
    // So check if this `uploads`(i.e src/controllers/test/create.ts) fails,
    // it should calls this `BadRequestError`
    it('should throw file upload error', () => {
      const req: Request = gigMockRequest({}, sellerGig, authUserPayload) as unknown as Request;
      const res: Response = gigMockResponse();
      jest.spyOn(gigCreateSchema, 'validate').mockImplementation((): any =>
        Promise.resolve({
          // In order for this `uploads` to be called, i need to return an empty
          // object here
          error: {}
        })
      );
      // And then i want to spy on this `uploads` method from
      // the library `tradenexus-shared`. And in order to do this, i need
      // to import all from the helper library. So asterisk for all. And then
      // here, i need to spy on the uploads method `helper` and then i want
      // to spy on `uploads`. And i want the `uploads` to return an error.
      // So im doing mock implementation.
      // Inside `create.ts`, im saying if the `result` object does not contain
      // any public id, then it is an error. i.e `if (!result.public_id) {}`
      // So this is why, im setting this `public_id` value to empty.
      // `public_id` is enough, im not using any `version` here.
      jest.spyOn(helper, 'uploads').mockImplementation((): any => Promise.resolve({ public_id: '' }));

      // Now i need to check what what i expect the errors to be called with.
      // I expect the error to be called with `BadRequestError`
      gigCreate(req, res).catch(() => {
        expect(BadRequestError).toHaveBeenCalledWith('File upload error. Try again.', 'Create gig() method');
      });
    });

    // Last test is simply going to be checking if everything (i.e this part
    // `validte` is successful and also this part `uploads` is successful),
    // then i expect `createGig()` to be called and the object in the JSON
    // should be `message` and `gig`.
    it('should create a new gig and return the correct response', async () => {
      // Here i have request, response
      const req: Request = gigMockRequest({}, sellerGig, authUserPayload) as unknown as Request;
      const res: Response = gigMockResponse();
      // And then setting `validate` method. It shouldn't return an error.
      jest.spyOn(gigCreateSchema, 'validate').mockImplementation((): any => Promise.resolve({ error: {} }));
      // And then helper `uploads`, it should return a `public_id`.
      jest.spyOn(helper, 'uploads').mockImplementation((): any => Promise.resolve({ public_id: '123456789' }));
      // And then, im spying on this `createGig` method
      jest.spyOn(gigService, 'createGig').mockResolvedValue(sellerGig);

      await gigCreate(req, res);
      // And then here im expected it to be 201 because the status code is
      // 201 inside `create.ts` and the message should be `Gig created successfully`
      // and then it should have the `gig` object.
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Gig created successfully.',
        gig: sellerGig
      });
    });
  });
});
