// Here i want to test create controller. Im going to just run some simple
// tests on the `intent` controller and then on the `order` controller.
// So what im going to do is, im going to check if all of these methods like
// `.search` are available and they return the actual response that i want.
// Im only going to add one test for this `intent` controller. So i just want
// to check that it returns the actual response.
// Im going to mock `stripe.customers.search()`, `stripe.customers.create()`
// and `stripe.paymentIntents.create()`.
// For this i will add only one test. Test to see what the actual response is
// if everything returns the correct information.
// I can also add test like maybe what happens if the intent was not created
// or if no search user was returned.

import { Request, Response } from 'express';
import * as orderService from '@order/services/order.service';
import { orderMockRequest, orderDocument, authUserPayload, orderMockResponse } from '@order/controllers/order/test/mock/order.mock';
import { intent } from '@order/controllers/order/create';

/* eslint-disable @typescript-eslint/no-explicit-any */

// I want to mock the order service.
jest.mock('@order/services/order.service');
// Then i want to mock the shared library.
jest.mock('@colson0x1/tradenexus-shared');
// I want to mock the schemes so that the test doesn't try to call the actual
// implementation.
jest.mock('@order/schemes/order.schema');
// Mock elasticsearch.
jest.mock('@elastic/elasticsearch');

// Now i want to mock Stripe because testing this `intent`, i dont want to call
// the actual implementation of the stripe instance and the stripe search.
// So i want to mock it. Im going to mock the customers object and then get the
// search because im not going to test this case for customers create.  I only
// want to mock the customers search i.e `stripe.customers.search`.
// And then im going to mock the `paymentIntents.create`.
const mockPaymentIntentsCreate = jest.fn();
const mockCustomersSearch = jest.fn();
// Mock stripe.
jest.mock('stripe', () => {
  /* return jest.fn().mockImplementation(() => ({
    customers: { search: mockCustomersSearch },
    paymentIntents: { create: mockPaymentIntentsCreate }
  })); */
  jest.fn(() => ({
    paymentIntents: {
      // So once the code, the test gets to this create part, instead of
      // calling the actual implementation, it will just return this
      // mockPaymentIntentsCreate. So its not going to throw an error.
      create: (...args: any) => mockPaymentIntentsCreate(...args) as unknown
    },
    customers: {
      search: (...args: any) => mockCustomersSearch(...args) as unknown
    }
  }));
});

describe('Order Controller', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Im not going to add any complex tests. I only just want to check if this
  // method `intent` from create.ts controller is called and what response
  // does it returns. Now i have set the mock for customers.search and
  // customers.create.
  describe('intent method', () => {
    it('should create a new intent and return the correct response', async () => {
      // So what do i expect this `intent` to return is, to have a message
      // that says `Order intent created successfully` and then it needs to
      // have a client secret and payment intent id. I can mock all of those.
      const req: Request = orderMockRequest({}, orderDocument, authUserPayload) as unknown as Request;
      const res: Response = orderMockResponse();
      // I have my Request and Response. Now i want to mock this `.search`
      // because the search either returns this data array with a length of 0.
      // That means, that is the case where customer has not been created. But
      // if this length contains an object, the customer has been created.
      // So im going to use only the case where it contains an object.
      mockCustomersSearch.mockResolvedValueOnce({ data: [{ id: '12345678' }] });
      // Here im mocking the payment intents create and im expect it to have
      // the client secret and id.
      mockPaymentIntentsCreate.mockResolvedValueOnce({ client_secret: '1234567890', id: '123456789' });
      await intent(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Order intent created successfully.',
        clientSecret: '1234567890',
        paymentIntentId: '123456789'
      });
    });
  });
});
