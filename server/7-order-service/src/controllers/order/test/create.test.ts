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
import { intent, order } from '@order/controllers/order/create';
import { BadRequestError, IOrderDocument } from '@colson0x1/tradenexus-shared';
import { orderSchema } from '@order/schemes/order.schema';

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
// The reason why it fails on npm run test throwing eror:
// `TypeError: stripe_1.default is not a constructor`
// because im not mocking it as a default export. So i need to mock this as a
// default export.
jest.mock('stripe', () => {
  /* return jest.fn().mockImplementation(() => ({
    customers: { search: mockCustomersSearch },
    paymentIntents: { create: mockPaymentIntentsCreate }
  })); */
  return {
    // It seems like from the stripe class on create.ts controller, it was
    // exported as default and esModule was used on it. So probably that is
    // why the mocking failed.
    // So because of how Stripe was exported.
    // `import Stripe from 'stripe;`
    // Its exported as a default in create.ts controller.
    // These properties on express are not exported as a default  i.e
    // `import { Request, Response } from 'express';`
    // But the Stripe clas was exported as a default. So probably i need to set,
    // return the default property as well.
    __esModule: true,
    default: jest.fn(() => ({
      paymentIntents: {
        // So once the code, the test gets to this create part, instead of
        // calling the actual implementation, it will just return this
        // mockPaymentIntentsCreate. So its not going to throw an error.
        create: (...args: any) => mockPaymentIntentsCreate(...args) as unknown
      },
      customers: {
        search: (...args: any) => mockCustomersSearch(...args) as unknown
      }
    }))
  };
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

  describe('order method', () => {
    it('should throw an error for invalid schema data', async () => {
      const req: Request = orderMockRequest({}, orderDocument, authUserPayload) as unknown as Request;
      const res: Response = orderMockResponse();
      jest.spyOn(orderSchema, 'validate').mockImplementation((): any =>
        Promise.resolve({
          error: {
            name: 'ValidationError',
            isJoi: true,
            details: [{ message: 'This is an error message' }]
          }
        })
      );

      order(req, res).catch(() => {
        // This is the first case for this test.
        // So here i expect it to have `This is an error message` on the first part
        // and then the `Create order() method` on the second part.
        expect(BadRequestError).toHaveBeenCalledWith('This is an error message', 'Create order() method');
      });
    });

    // Second test will be just to return the correct response.
    // Im not checking if this method `createOrder()` was actually called.
    // I just want to check the order json response. So it should return
    // correct JSON response.
    it('should return correct json response', async () => {
      const req: Request = orderMockRequest({}, orderDocument, authUserPayload) as unknown as Request;
      const res: Response = orderMockResponse();
      const serviceFee: number = req.body.price < 50 ? (5.5 / 100) * req.body.price + 2 : (5.5 / 100) * req.body.price;
      let orderData: IOrderDocument = req.body;
      orderData = { ...orderData, serviceFee };
      jest.spyOn(orderSchema, 'validate').mockImplementation((): any => Promise.resolve({ error: {} }));
      // I need to mock the `createOrder` method because it is this method
      // that returns the created order.  # crete.ts controller -> order method
      // so im using: import * as orderService from '@order/services/order.service';
      // So the method i want to spy on is the `createOrder` method. Then i can
      // either mock a return value or mock a resolved value.
      // mockResolvedValue is just basically for a method that returns simply
      // a promise.
      // The `createOrder` method on the create.ts is what returns the order
      // that i send to the api gateway. So here i mock the method and the
      // method should return `orderData`.
      jest.spyOn(orderService, 'createOrder').mockResolvedValue(orderData);

      await order(req, res);
      // 201 since response status is `CREATED`.
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Order created successfully.',
        // And then i expect here the `order` to have a value of `orderData`.
        order: orderData
      });
    });
  });
});
