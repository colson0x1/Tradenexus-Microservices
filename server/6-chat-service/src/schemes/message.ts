import Joi, { ObjectSchema } from 'joi';

// Message that im going to send from the Frontend will contain these properties.
const messageSchema: ObjectSchema = Joi.object().keys({
  // This `conversationId` is optional because for the first message, there is
  // no conversation. And if there's a conversationId property, for the validation,
  // i can expect it to have either null or an empty string
  conversationId: Joi.string().optional().allow(null, ''),
  // `_id` of the message
  _id: Joi.string().optional(),
  // `body` which is the message is optional as well
  body: Joi.string().optional().allow(null, ''),
  // `hasConversationId` is only going to be used in the controller to check
  // if the message document has a `conversationId`.
  hasConversationId: Joi.boolean().optional(), // this is only for checking if conversation id exist
  // And then in terms of files that will be sent, I could probably added these
  // four below as an object but i decided to add them as separate properties.
  // So its going to be the `file`
  file: Joi.string().optional().allow(null, ''),
  // `fileType` is so if its a zip type, if its an image, if its a video,
  // whatever its going to be sent. So maybe the buyer or the seller sends a
  // file. The `file` above is probably a base64 encoded string.
  fileType: Joi.string().optional().allow(null, ''),
  // `fileName` is going to be the name of the file that is sent.
  fileName: Joi.string().optional().allow(null, ''),
  // `fileSize` is going to be the size of the file that is sent.
  fileSize: Joi.string().optional().allow(null, ''),
  // `gigId` is about the gig that the buyer and the seller are communicating
  // about.
  gigId: Joi.string().optional().allow(null, ''),
  sellerId: Joi.string().required().messages({
    'string.base': 'Seller id is required',
    'string.empty': 'Seller id is required',
    'any.required': 'Seller id is required'
  }),
  buyerId: Joi.string().required().messages({
    'string.base': 'Buyer id is required',
    'string.empty': 'Buyer id is required',
    'any.required': 'Buyer id is required'
  }),
  // NOTE!
  // The reason why i decide to use these properties `senderUsername`, `senderPicture`,
  // `receiverUsername` is because in my application, once the user creates
  // these properties like the username, the email, thehy will not be changed
  // throughout the lifetime of the user on the application. That is why i
  // decided to just use the username so they are not going to change!! So once
  // they create them, then im going to use the same way throughout.
  // If i have a different case where i need to allow the users to be able to
  // update their username, then i dont think this approach will make sense.
  // Then i have to look for a way whereby in the schema or the database model.
  // i dont save the senderUsername directly or the receiverUsername. I instead
  // save a reference. And then i can use it so that anytime they updates, i only
  // have the reference in the schema. But for me, im just using the username,
  // the senderPicture, receiverUsername, senderUsername because they are not
  // going to change.
  senderUsername: Joi.string().required().messages({
    'string.base': 'Sender username is required',
    'string.empty': 'Sender username is required',
    'any.required': 'Sender username is required'
  }),
  senderPicture: Joi.string().required().messages({
    'string.base': 'Sender picture is required',
    'string.empty': 'Sender picture is required',
    'any.required': 'Sender picture is required'
  }),
  receiverUsername: Joi.string().required().messages({
    'string.base': 'Receiver username is required',
    'string.empty': 'Receiver username is required',
    'any.required': 'Receiver username is required'
  }),
  receiverPicture: Joi.string().required().messages({
    'string.base': 'Receiver picture is required',
    'string.empty': 'Receiver picture is required',
    'any.required': 'Receiver picture is required'
  }),
  isRead: Joi.boolean().optional(),
  // if `hasOffer` is true then the seller has sent an offer
  hasOffer: Joi.boolean().optional(),
  // And then for the offer object, these are for the custom offer. so these
  // are the properties that im going to send.
  offer: Joi.object({
    gigTitle: Joi.string().optional(),
    price: Joi.number().optional(),
    description: Joi.string().optional(),
    deliveryInDays: Joi.number().optional(),
    oldDeliveryDate: Joi.string().optional(),
    newDeliveryDate: Joi.string().optional(),
    accepted: Joi.boolean().optional(),
    cancelled: Joi.boolean().optional()
  }).optional(),
  createdAt: Joi.string().optional()
});

export { messageSchema };

/* @ Implementation using Zod
import { z } from 'zod';

export const messageSchema = z.object({
  conversationId: z.string().nullable().optional(), // allows null and undefined; empty string is valid as it's a string
  _id: z.string().optional(),
  body: z.string().nullable().optional(),
  hasConversationId: z.boolean().optional(),
  file: z.string().nullable().optional(),
  fileType: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
  fileSize: z.string().nullable().optional(),
  gigId: z.string().nullable().optional(),
  sellerId: z.string({
    required_error: 'Seller id is required',
    invalid_type_error: 'Seller id is required'
  }),
  buyerId: z.string({
    required_error: 'Buyer id is required',
    invalid_type_error: 'Buyer id is required'
  }),
  senderUsername: z.string({
    required_error: 'Sender username is required',
    invalid_type_error: 'Sender username is required'
  }),
  senderPicture: z.string({
    required_error: 'Sender picture is required',
    invalid_type_error: 'Sender picture is required'
  }),
  receiverUsername: z.string({
    required_error: 'Receiver username is required',
    invalid_type_error: 'Receiver username is required'
  }),
  receiverPicture: z.string({
    required_error: 'Receiver picture is required',
    invalid_type_error: 'Receiver picture is required'
  }),
  isRead: z.boolean().optional(),
  hasOffer: z.boolean().optional(),
  offer: z
    .object({
      gigTitle: z.string().optional(),
      price: z.number().optional(),
      description: z.string().optional(),
      deliveryInDays: z.number().optional(),
      oldDeliveryDate: z.string().optional(),
      newDeliveryDate: z.string().optional(),
      accepted: z.boolean().optional(),
      cancelled: z.boolean().optional()
    })
    .optional(),
  createdAt: z.string().optional()
});
 * */

/* @ If username can be changed, then here's the implementation using both
 * Joi and Zod. */

/* @ Implementation using Joi
import Joi, { ObjectSchema } from 'joi';
*
/**
 * Revised message schema:
 * - The conversationId, _id, body, file-related properties, and gigId remain unchanged.
 * - Instead of storing immutable senderUsername, senderPicture, receiverUsername, and receiverPicture,
 *   we now use senderId and receiverId to reference the user records.
 * - This allows user profile changes (such as username updates) to be propagated throughout the app.
 */
/*
const messageSchema: ObjectSchema = Joi.object().keys({
  conversationId: Joi.string().optional().allow(null, ''),
  _id: Joi.string().optional(),
  body: Joi.string().optional().allow(null, ''),
  hasConversationId: Joi.boolean().optional(),
  file: Joi.string().optional().allow(null, ''),
  fileType: Joi.string().optional().allow(null, ''),
  fileName: Joi.string().optional().allow(null, ''),
  fileSize: Joi.string().optional().allow(null, ''),
  gigId: Joi.string().optional().allow(null, ''),
  sellerId: Joi.string().required().messages({
    'string.base': 'Seller id is required',
    'string.empty': 'Seller id is required',
    'any.required': 'Seller id is required'
  }),
  buyerId: Joi.string().required().messages({
    'string.base': 'Buyer id is required',
    'string.empty': 'Buyer id is required',
    'any.required': 'Buyer id is required'
  }),
  // Instead of static usernames, we store a reference (user id) for sender and receiver.
  senderId: Joi.string().required().messages({
    'string.base': 'Sender id is required',
    'string.empty': 'Sender id is required',
    'any.required': 'Sender id is required'
  }),
  receiverId: Joi.string().required().messages({
    'string.base': 'Receiver id is required',
    'string.empty': 'Receiver id is required',
    'any.required': 'Receiver id is required'
  }),
  isRead: Joi.boolean().optional(),
  hasOffer: Joi.boolean().optional(),
  offer: Joi.object({
    gigTitle: Joi.string().optional(),
    price: Joi.number().optional(),
    description: Joi.string().optional(),
    deliveryInDays: Joi.number().optional(),
    oldDeliveryDate: Joi.string().optional(),
    newDeliveryDate: Joi.string().optional(),
    accepted: Joi.boolean().optional(),
    cancelled: Joi.boolean().optional()
  }).optional(),
  createdAt: Joi.string().optional()
});

export { messageSchema };
*/

/* Implementation using Zod */
/*
import { z } from 'zod';

/**
 * Revised message schema:
 * - The conversationId, _id, body, file-related properties, and gigId remain unchanged.
 * - For a mutable username scenario, we now use senderId and receiverId to reference user records,
 *   rather than embedding static usernames and pictures in each message.
 */
/*
export const messageSchema = z.object({
  conversationId: z.string().nullable().optional(),
  _id: z.string().optional(),
  body: z.string().nullable().optional(),
  hasConversationId: z.boolean().optional(),
  file: z.string().nullable().optional(),
  fileType: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
  fileSize: z.string().nullable().optional(),
  gigId: z.string().nullable().optional(),
  sellerId: z.string({
    required_error: 'Seller id is required',
    invalid_type_error: 'Seller id is required'
  }),
  buyerId: z.string({
    required_error: 'Buyer id is required',
    invalid_type_error: 'Buyer id is required'
  }),
  // Instead of embedding senderUsername/receiverUsername and pictures,
  // we now require the senderId and receiverId so that the user profile can be looked up.
  senderId: z.string({
    required_error: 'Sender id is required',
    invalid_type_error: 'Sender id is required'
  }),
  receiverId: z.string({
    required_error: 'Receiver id is required',
    invalid_type_error: 'Receiver id is required'
  }),
  isRead: z.boolean().optional(),
  hasOffer: z.boolean().optional(),
  offer: z.object({
    gigTitle: z.string().optional(),
    price: z.number().optional(),
    description: z.string().optional(),
    deliveryInDays: z.number().optional(),
    oldDeliveryDate: z.string().optional(),
    newDeliveryDate: z.string().optional(),
    accepted: z.boolean().optional(),
    cancelled: z.boolean().optional()
  }).optional(),
  createdAt: z.string().optional()
});
*/
