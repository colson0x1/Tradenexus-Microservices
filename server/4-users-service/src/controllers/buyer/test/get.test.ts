import { Request, Response } from 'express';
import { authUserPayload, buyerDocument, buyerMockRequest, buyerMockResponse } from '@users/controllers/buyer/test/mocks/buyer.mock';
import * as buyer from '@users/services/buyer.service';
import { currentUsername, email, username } from '@users/controllers/buyer/get';

// Mock Buyers service, helpers library, and Elasticsearch
jest.mock('@users/services/buyer.service');
jest.mock('@colson0x1/tradenexus-shared');
jest.mock('@elastic/elasticsearch');

describe('Buyer Controller', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  // If we're using timeouts, we can do the same as well

  // @ `get.test.ts`
  // Here, im only going to test `email`, `currentUser` and `username` methods
  // So what i want to do is, just if this `getBuyerByEmail()` returns an
  // actual results, then i expect that to send the correct response.
  describe('email method', () => {
    it('should return buyer profile data', async () => {
      // i will only test the case whereby it returns an actual data. i will
      // perhaps test the case if it doesn't return later i.e if it returns
      // null. so i can later test the null case and if i do that null case,
      // then buyer value should be null. but here im only testing the buyer
      // document.
      // i.e
      // `src/controllers/buyer/get.ts`
      // const email = ( ... ) {}
      // If i test the null case, then, the `buyer` returned here at should be
      // null.
      // .json({ message, 'Buyer profile', buyer })
      // Here, we dont need the `session` data and can set session to empty.
      // `currentUser` im going to get from `IAuthPayload` defined above so
      // authUserPayload
      const req: Request = buyerMockRequest({}, authUserPayload) as unknown as Request;
      // `controllers/buyer/get.ts`. Here i want to spy on this method `getBuyerEmail`
      // and make it return the buyer documents.
      const res: Response = buyerMockResponse();
      // Im only testing where it returns an actual document. I might test
      // if it returns null, later.
      jest.spyOn(buyer, 'getBuyerByEmail').mockResolvedValue(buyerDocument);

      await email(req, res);
      // Here i expect `res.status` to have been called with 200 because
      // that is the status code i.e OK in `email` method response from
      // `controllers/buyer/get.ts`
      // So i expect it if it returns the buyer document then it should
      // be called with 200
      expect(res.status).toHaveBeenCalledWith(200);
      // And then i expect the json to have been called with document
      // message `Buyer profile` and then `buyer` should be of type
      // `buyerDocument`
      expect(res.json).toHaveBeenCalledWith({ message: 'Buyer profile', buyer: buyerDocument });
      // So that is what i expect. Thats only the success case if that
      // method `getBuyerByEmail()` returns an actual document. Now if it
      // returns null, i have to write test for it.
    });

    // Test case where it returns null
    it('should return null', async () => {
      const req: Request = buyerMockRequest({}, authUserPayload) as unknown as Request;
      const res: Response = buyerMockResponse();
      jest.spyOn(buyer, 'getBuyerByEmail').mockResolvedValue(null);

      await email(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      // So here i expect `buyer` to be `null`
      expect(res.json).toHaveBeenCalledWith({ message: 'Buyer profile', buyer: null });
    });
  });

  describe('currentUser method', () => {
    it('should return buyer profile data', async () => {
      const req: Request = buyerMockRequest({}, authUserPayload) as unknown as Request;
      const res: Response = buyerMockResponse();
      jest.spyOn(buyer, 'getBuyerByUsername').mockResolvedValue(buyerDocument);

      await currentUsername(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Buyer profile', buyer: buyerDocument });
    });

    it('should return null', async () => {
      const req: Request = buyerMockRequest({}, authUserPayload) as unknown as Request;
      const res: Response = buyerMockResponse();
      jest.spyOn(buyer, 'getBuyerByUsername').mockResolvedValue(null);

      await currentUsername(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Buyer profile', buyer: null });
    });
  });

  describe('username method', () => {
    it('should return buyer profile data', async () => {
      // username params is required because `username` requires `req.params.useraname`
      // i.e it requires to set the username in the params so im adding
      // `{ username: 'colson' }` here in the `req` params
      // And above, i already have the `params` object and im passing the
      // `username` which is defined in `IParams` above.
      const req: Request = buyerMockRequest({}, authUserPayload, { username: 'colson' }) as unknown as Request;
      const res: Response = buyerMockResponse();
      jest.spyOn(buyer, 'getBuyerByUsername').mockResolvedValue(buyerDocument);

      await username(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Buyer profile', buyer: buyerDocument });
    });

    it('should return null', async () => {
      const req: Request = buyerMockRequest({}, authUserPayload, { username: 'colson' }) as unknown as Request;
      const res: Response = buyerMockResponse();
      jest.spyOn(buyer, 'getBuyerByUsername').mockResolvedValue(null);

      await username(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Buyer profile', buyer: null });
    });
  });
});
