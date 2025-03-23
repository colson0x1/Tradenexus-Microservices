import Joi, { ObjectSchema } from 'joi';

// Here i decided to just use one collection for the Order. I could have
// separated maybe `events`, `buyerReview`, `sellerReview`, `deliveredWork`,
// and `requestExtension`. So i could have seperated them into their own
// collection or into their own model. But i decided to have all of this so
// that i dont need to probably add more methods to fetch them and then add
// them to the request when they are being sent to the frontend.
// It is recommended to use separate collections for production.

const orderSchema: ObjectSchema = Joi.object().keys({
  offer: Joi.object({
    gigTitle: Joi.string().required(),
    price: Joi.number().required(),
    description: Joi.string().required(),
    deliveryInDays: Joi.number().required(),
    oldDeliveryDate: Joi.string().required(),
    newDeliveryDate: Joi.string().optional(),
    accepted: Joi.boolean().required(),
    cancelled: Joi.boolean().required()
  }).required(),
  gigId: Joi.string().required(),
  sellerId: Joi.string().required(),
  sellerUsername: Joi.string().required(),
  sellerEmail: Joi.string().required(),
  sellerImage: Joi.string().required(),
  gigCoverImage: Joi.string().required(),
  gigMainTitle: Joi.string().required(),
  gigBasicTitle: Joi.string().required(),
  gigBasicDescription: Joi.string().required(),
  buyerId: Joi.string().required(),
  buyerUsername: Joi.string().required(),
  buyerEmail: Joi.string().required(),
  buyerImage: Joi.string().required(),
  status: Joi.string().required(),
  orderId: Joi.string().required(),
  invoiceId: Joi.string().required(),
  quantity: Joi.number().required(),
  price: Joi.number().required(),
  serviceFee: Joi.number().optional(),
  requirements: Joi.string().optional().allow(null, ''),
  paymentIntent: Joi.string().required(),
  requestExtension: Joi.object({
    originalDate: Joi.string().required(),
    newDate: Joi.string().required(),
    days: Joi.number().required(),
    reason: Joi.string().required()
  }).optional(),
  delivered: Joi.boolean().optional(),
  approvedAt: Joi.string().optional(),
  deliveredWork: Joi.array()
    .items(
      Joi.object({
        message: Joi.string(),
        file: Joi.string()
      })
    )
    .optional(),
  dateOrdered: Joi.string().optional(),
  events: Joi.object({
    placeOrder: Joi.string(),
    requirements: Joi.string(),
    orderStarted: Joi.string(),
    deliverydateUpdate: Joi.string().optional(),
    orderDelivered: Joi.string().optional(),
    buyerReview: Joi.string().optional(),
    sellerReview: Joi.string().optional()
  }).optional(),
  buyerReview: Joi.object({
    rating: Joi.number(),
    review: Joi.string()
  }).optional(),
  sellerReview: Joi.object({
    rating: Joi.number(),
    review: Joi.string()
  }).optional()
});

const orderUpdateSchema: ObjectSchema = Joi.object().keys({
  originalDate: Joi.string().required(),
  newDate: Joi.string().required(),
  days: Joi.number().required(),
  reason: Joi.string().required(),
  deliveryDateUpdate: Joi.string().optional()
});

export { orderSchema, orderUpdateSchema };

/* @ Implementation using Zod
 import { z } from 'zod';

export const orderSchema = z.object({
  offer: z.object({
    gigTitle: z.string(),
    price: z.number(),
    description: z.string(),
    deliveryInDays: z.number(),
    oldDeliveryDate: z.string(),
    newDeliveryDate: z.string().optional(),
    accepted: z.boolean(),
    cancelled: z.boolean(),
  }),
  gigId: z.string(),
  sellerId: z.string(),
  sellerUsername: z.string(),
  sellerEmail: z.string(),
  sellerImage: z.string(),
  gigCoverImage: z.string(),
  gigMainTitle: z.string(),
  gigBasicTitle: z.string(),
  gigBasicDescription: z.string(),
  buyerId: z.string(),
  buyerUsername: z.string(),
  buyerEmail: z.string(),
  buyerImage: z.string(),
  status: z.string(),
  orderId: z.string(),
  invoiceId: z.string(),
  quantity: z.number(),
  price: z.number(),
  serviceFee: z.number().optional(),
  // Allowing undefined, null, or empty string
  requirements: z.string().nullable().optional(),
  paymentIntent: z.string(),
  requestExtension: z.object({
    originalDate: z.string(),
    newDate: z.string(),
    days: z.number(),
    reason: z.string(),
  }).optional(),
  delivered: z.boolean().optional(),
  approvedAt: z.string().optional(),
  deliveredWork: z.array(
    z.object({
      message: z.string().optional(),
      file: z.string().optional(),
    })
  ).optional(),
  dateOrdered: z.string().optional(),
  events: z.object({
    placeOrder: z.string().optional(),
    requirements: z.string().optional(),
    orderStarted: z.string().optional(),
    deliverydateUpdate: z.string().optional(),
    orderDelivered: z.string().optional(),
    buyerReview: z.string().optional(),
    sellerReview: z.string().optional(),
  }).optional(),
  buyerReview: z.object({
    rating: z.number().optional(),
    review: z.string().optional(),
  }).optional(),
  sellerReview: z.object({
    rating: z.number().optional(),
    review: z.string().optional(),
  }).optional(),
});

export const orderUpdateSchema = z.object({
  originalDate: z.string(),
  newDate: z.string(),
  days: z.number(),
  reason: z.string(),
  deliveryDateUpdate: z.string().optional(),
});
 * */
