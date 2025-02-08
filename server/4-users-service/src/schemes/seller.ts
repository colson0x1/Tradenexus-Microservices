/* @ Seller validation scheme */
// This schema will be used for validation. So when a seller wants to create
// a seller's profile or when they want to update a seller's profile, this
// `sellerSchema` will be used.

import Joi, { ObjectSchema } from 'joi';

const sellerSchema: ObjectSchema = Joi.object().keys({
  fullName: Joi.string().required().messages({
    'string.base': 'Fullname must be of type string',
    'string.empty': 'Fullname is required',
    'any.required': 'Fullname is required'
  }),
  // Whenever we create a MongoDB document, it creates the `_id` which is
  // automatically indexed
  _id: Joi.string().optional(),
  // I might send that `_id` using `id` across different services
  id: Joi.string().optional(),
  // username is optional so it could be added or it could be omitted when
  // sending the request with the sellerSchema
  username: Joi.string().optional(),
  // profilePublicId, i expect `null` or empty string i.e ''
  profilePublicId: Joi.string().optional().allow(null, ''),
  email: Joi.string().optional(),
  profilePicture: Joi.string().required().messages({
    'string.base': 'Please add a profile picture',
    'string.empty': 'Profile picture is required',
    'any.required': 'Profile picture is required'
  }),
  description: Joi.string().required().messages({
    'string.base': 'Please add a seller description',
    'string.empty': 'Seller description is required',
    'any.required': 'Seller description is required'
  }),
  country: Joi.string().required().messages({
    'string.base': 'Please select a country',
    'string.empty': 'Country field is required',
    'any.required': 'Country field is required'
  }),
  oneliner: Joi.string().required().messages({
    'string.base': 'Please add your oneliner',
    'string.empty': 'Oneliner field is required',
    'any.required': 'Oneliner field is required'
  }),
  // For the skills, im expecting it to be an array. And the array should
  // contain items that are of type strings and should have at least one
  // item inside the array.
  skills: Joi.array().items(Joi.string()).required().min(1).messages({
    'string.base': 'Please add at least one skill',
    'string.empty': 'Skills are required',
    'any.required': 'Skills are required',
    'array.min': 'Please add at least one skill'
  }),
  // Normally when we create an array object to MongoDB, it'll automatically
  // create an ID. The reason why I added this `_id` is so that when i want to
  // update, i can do it. Because if i dont add this `_id` , if i don't add
  // this and then i want to update, Joi will check okay, this `languages`,
  // it has the `_id` but `_id` is not defined. So for the first time when
  // im creating it, i can omit i.e im not going to send `_id` but when i
  // want to update, i need this `_id` property. That is why im setting it (_id)
  // to optional. It could be available or it could not be available.
  /* `_id: Joi.string().optional()` */
  languages: Joi.array()
    .items(
      Joi.object({
        _id: Joi.string().optional(),
        language: Joi.string(),
        level: Joi.string()
      })
    )
    .required()
    // We require at least one item inside the `languages` array otherwise we
    // display this error messages
    .min(1)
    .messages({
      'string.base': 'Please add at least one language',
      'string.empty': 'Languages are required',
      'any.required': 'Languages are required',
      'array.min': 'Please add at least one language'
    }),
  // For responseTime, value must be greater than 0. So if 0 or less than 0
  // then display error messages
  responseTime: Joi.number().required().greater(0).messages({
    'string.base': 'Please add a response time',
    'string.empty': 'Response time is required',
    'any.required': 'Response time is required',
    'number.greater': 'Response time must be greater than zero'
  }),
  experience: Joi.array()
    .items(
      Joi.object({
        _id: Joi.string().optional(),
        company: Joi.string(),
        title: Joi.string(),
        startDate: Joi.string(),
        endDate: Joi.string(),
        description: Joi.string(),
        currentlyWorkingHere: Joi.boolean()
      })
    )
    .required()
    // Requires at least one object inside the `experience` array
    .min(1)
    .messages({
      'string.base': 'Please add at least one work experience',
      'string.empty': 'Experience is required',
      'any.required': 'Experience is required',
      'array.min': 'Please add at least one work experience'
    }),
  education: Joi.array()
    .items(
      Joi.object({
        _id: Joi.string().optional(),
        country: Joi.string(),
        university: Joi.string(),
        title: Joi.string(),
        major: Joi.string(),
        year: Joi.string()
      })
    )
    .required()
    .min(1)
    .messages({
      'string.base': 'Please add at least one education',
      'string.empty': 'Education is required',
      'any.required': 'Education is required',
      'array.min': 'Please add at least one education'
    }),
  // This socialLinks is an array but its optional. It can be available or it
  // can be omitted.
  socialLinks: Joi.array().optional().allow(null, ''),
  // certificates is optional as well. its not a required property. its an
  // array and i expect this object properties. Apart from `_id`, if the
  // `name`, `from` or `year` is missing, it will throw an error.
  certificates: Joi.array()
    .items(
      Joi.object({
        _id: Joi.string().optional(),
        name: Joi.string(),
        from: Joi.string(),
        year: Joi.number()
      })
    )
    .optional()
    .allow(null, ''),
  // ratingsCount is a number and its optional
  ratingsCount: Joi.number().optional(),
  // ratingCategories is an object and its optional and it expects the value
  // and the count to both be numbers.
  ratingCategories: Joi.object({
    five: { value: Joi.number(), count: Joi.number() },
    four: { value: Joi.number(), count: Joi.number() },
    three: { value: Joi.number(), count: Joi.number() },
    two: { value: Joi.number(), count: Joi.number() },
    one: { value: Joi.number(), count: Joi.number() }
  }).optional(),
  // All of the properties below are all optional
  ratingSum: Joi.number().optional(),
  recentDelivery: Joi.string().optional().allow(null, ''),
  ongoingJobs: Joi.number().optional(),
  completedJobs: Joi.number().optional(),
  cancelledJobs: Joi.number().optional(),
  totalEarnings: Joi.number().optional(),
  totalGigs: Joi.number().optional(),
  createdAt: Joi.string().optional()
});

export { sellerSchema };

/* @ Implementation using Zod */

/*
import { z } from 'zod';

const sellerSchema = z.object({
  fullName: z.string().nonempty('Fullname is required'),
  _id: z.string().optional(),
  id: z.string().optional(),
  username: z.string().optional(),
  profilePublicId: z.string().nullable().optional(),
  email: z.string().email().optional(),
  profilePicture: z.string().nonempty('Please add a profile picture'),
  description: z.string().nonempty('Seller description is required'),
  country: z.string().nonempty('Please select a country'),
  oneliner: z.string().nonempty('Please add your oneliner'),
  skills: z.array(z.string()).nonempty('Please add at least one skill'),
  languages: z.array(z.object({
    language: z.string(),
    level: z.string()
  })).nonempty('Please add at least one language'),
  responseTime: z.number().positive('Response time must be greater than zero').int('Response time must be an integer'),
  experience: z.array(z.object({
    company: z.string(),
    title: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    description: z.string(),
    currentlyWorkingHere: z.boolean()
  })).nonempty('Please add at least one work experience'),
  education: z.array(z.object({
    university: z.string(),
    title: z.string(),
    major: z.string(),
    year: z.string()
  })).nonempty('Please add at least one education'),
  socialLinks: z.array(z.string()).optional().nullable(),
  certificates: z.array(z.object({
    name: z.string(),
    from: z.string(),
    year: z.number()
  })).optional().nullable(),
  ratingsCount: z.number().optional(),
  ratingCategories: z.object({
    five: z.object({ value: z.number(), count: z.number() }),
    four: z.object({ value: z.number(), count: z.number() }),
    three: z.object({ value: z.number(), count: z.number() }),
    two: z.object({ value: z.number(), count: z.number() }),
    one: z.object({ value: z.number(), count: z.number() })
  }).optional(),
  ratingSum: z.number().optional(),
  recentDelivery: z.string().nullable().optional(),
  ongoingJobs: z.number().optional(),
  completedJobs: z.number().optional(),
  cancelledJobs: z.number().optional(),
  totalEarnings: z.number().optional(),
  totalGigs: z.number().optional(),
  createdAt: z.string().optional()
});

export { sellerSchema };
*/
