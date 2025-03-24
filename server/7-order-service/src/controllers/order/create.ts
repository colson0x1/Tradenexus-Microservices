// Two things i want to do. I want to create a customer, and then im going to
// create an intent. So the reason why im creating a customer is because when
// the seller cancels an order, stripe will send an email automatically to
// whichever customer made the payment. So that is the reason why im creating
// the customer. And then im also going to create an intent which is going to
// allow me to make an actual payment.
// The payment will be done in the frontend because on the frontend, the id
// that will be returned from this intent that im going to create, it will be
// used when i setup my frontend. And then whatever id is returned from the
// payment intent, im going to use it on the frontend. And then i use the
// client react library to create the actual payment. So on this backend, im
// only going to setup the endpoint to create a customer and then to create
// an intent.

import { config } from '@order/config';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import Stripe from 'stripe';

// Crete a new instance of Stripe
const stripe: Stripe = new Stripe(config.STRIPE_API_KEY!, {
  typescript: true
});

const intent = async (req: Request, res: Response): Promise<void> => {
  // Now what i want to do is create a customer. The reason im creating a customer
  // is so that if the order was cancelled by a seller. Then that customer based
  // on the email that im going to specify, stripe can automatically send an
  // email to the buyer.
  // But what i want to do is, i want to first of all search if the customer
  // already exists. I dont want to just create the customer. So i want to check
  // if the customer exists based on the email.
  const customer: Stripe.Response<Stripe.ApiSearchResult<Stripe.Customer>> = await stripe.customers.search({
    // For the query, im going to search by the email because i create the
    // customers using the email. Email is unique.
    // This will only be performed if the user is logged in. Once the  user is
    // logged in, i should have access to the current user object.
    // So i search by the email to check if the customer exists.
    query: `email:"${req.currentUser!.email}"`
  });
  // If the customer exists it will return object in the data array response.
  // If it is  empty then the customer does not exist. And if the customer
  // does not exist, i create a new customer.
  let customerId = '';
  // Here im checking if customer data.length is equal to 0.
  // `!customer.data.length` is same as `customer.data.length === 0`
  if (customer.data.length === 0) {
    // So if the length is 0, that means the customer has not been created. The
    // customer does not exist. So now i want to create a customer.
    const createdCustomer: Stripe.Response<Stripe.Customer> = await stripe.customers.create({
      // I want to create the customer using the email so that stripe can
      // send the message to the customer.
      // Im using email to search in the query so if it does not exist, then
      // i create.
      email: `${req.currentUser!.email}`,
      // Metadata is going to contain an object of any key value i want to add.
      // So this metadata can take any key value. Here im just saving the
      // buyerId.
      metadata: {
        buyerId: `${req.body.buyerId}`
      }
    });
    // Now once the customer is created, i want to get the customer id.
    // So what i need from the response is the id property.
    // Here i set the customerId to what i get from the created customer's id.
    customerId = createdCustomer.id;
  } else {
    // But if data array in the response contains the object, that means the
    // customer already exists. So i just get the id from the data at index 0.
    customerId = customer.data[0].id;
  }

  // Now that im able to create a new customer or retrieve an existing customer
  // by the email, i want to create an intent and that intent will map to the
  // customer. So whichever customer is making the payment, im going to use
  // the customer id that im returning above i.e `customerId` and then map
  // it to that intent i want to create.
  // Here, the reson why im adding this variable `paymentIntent` using let and
  // outside the if condition is because i want to send the payment intent id
  // to the client on the frontend.
  // So it is with that payment intent id that im going to make the actual
  // payment from the frontend.
  let paymentIntent: Stripe.Response<Stripe.PaymentIntent>;
  if (customerId) {
    // The service charge is going to be 5.5% of the total price. So if a gig
    // costs $10 usd, then im going to add a 5.5% charge to that. The 5.5% is
    // going to be if the price is less than $50 with an additional $2 applied
    // to it.
    // So the service charge is 5.5% of the purchase amount. For purchase under
    // $50, an additional $2 charge is applied
    // NOTE: im also going to always calculate it on the backend and in the
    // frontend. because if i calculate it on the frontend and i send it,
    // there might be some kind of dubious users of my application that might
    // understand exactly what to do and then they might change the value. So
    // i calculate it on the frontend and then calculate it on the backend as
    // well.
    const serviceFee: number = req.body.price < 50 ? (5.5 / 100) * req.body.price + 2 : (5.5 / 100) * req.body.price;
    paymentIntent = await stripe.paymentIntents.create({
      // amount has to be a number. not a floating point or decimal.
      // So whatever the value is going to be based on the service fee and the
      // price, just multiplying by 100, its going to convert it to the actual
      // number in cents.
      amount: Math.floor((req.body.price + serviceFee) * 100),
      currency: 'usd',
      // And then i want to add customer, so i need to set customer id.
      // Im mapping the customer to this particular payment.
      customer: customerId,
      automatic_payment_methods: { enabled: true }
    });
  }
  res.status(StatusCodes.CREATED).json({
    message: 'Order intent created successfully.',
    // So this client secret will be returned. I'll need this on the frontend.
    // Here im using ! to tell it that im expecting it to be a string.
    // So these are the information i want to send back to the frontend. But
    // its going to go through the API gateway and then from the API gateway
    // to the frontend.
    clientSecret: paymentIntent!.client_secret,
    paymentIntentId: paymentIntent!.id
  });
};

export { intent };
