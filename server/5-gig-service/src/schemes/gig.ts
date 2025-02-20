import Joi, { ObjectSchema } from 'joi';

const gigCreateSchema: ObjectSchema = Joi.object().keys({
  sellerId: Joi.string().required().messages({
    'string.base': 'Seller Id must be of type string',
    'string.empty': 'Seller Id is required',
    'any.required': 'Seller Id is required'
  }),
  profilePicture: Joi.string().required().messages({
    'string.base': 'Please add a profile picture',
    'string.empty': 'Profile picture is required',
    'any.required': 'Profile picture is required'
  }),
  title: Joi.string().required().messages({
    'string.base': 'Please add a gig title',
    'string.empty': 'Gig title is required',
    'any.required': 'Gig title is required'
  }),
  description: Joi.string().required().messages({
    'string.base': 'Please add a gig description',
    'string.empty': 'Gig description is required',
    'any.required': 'Gig description is required'
  }),
  categories: Joi.string().required().messages({
    'string.base': 'Please select a category',
    'string.empty': 'Gig category is required',
    'any.required': 'Gig category is required'
  }),
  subCategories: Joi.array().items(Joi.string()).required().min(1).messages({
    'string.base': 'Please add at least one subcategory',
    'string.empty': 'Gig subcategories are required',
    'any.required': 'Gig subcategories are required',
    'array.min': 'Please add at least one subcategory'
  }),
  tags: Joi.array().items(Joi.string()).required().min(1).messages({
    'string.base': 'Please add at least one tag',
    'string.empty': 'Gig tags are required',
    'any.required': 'Gig tags are required',
    'array.min': 'Please add at least one tag'
  }),
  price: Joi.number().required().greater(4.99).messages({
    'string.base': 'Please add a gig price',
    'string.empty': 'Gig price is required',
    'any.required': 'Gig price is required',
    'number.greater': 'Gig price must be greater than $4.99'
  }),
  coverImage: Joi.string().required().messages({
    'string.base': 'Please add a cover image',
    'string.empty': 'Gig cover image is required',
    'any.required': 'Gig cover image is required',
    'array.min': 'Please add a cover image'
  }),
  expectedDelivery: Joi.string().required().messages({
    'string.base': 'Please add expected delivery',
    'string.empty': 'Gig expected delivery is required',
    'any.required': 'Gig expected delivery is required',
    'array.min': 'Please add a expected delivery'
  }),
  basicTitle: Joi.string().required().messages({
    'string.base': 'Please add basic title',
    'string.empty': 'Gig basic title is required',
    'any.required': 'Gig basic title is required',
    'array.min': 'Please add a basic title'
  }),
  basicDescription: Joi.string().required().messages({
    'string.base': 'Please add basic description',
    'string.empty': 'Gig basic description is required',
    'any.required': 'Gig basic description is required',
    'array.min': 'Please add a basic description'
  })
});

const gigUpdateSchema: ObjectSchema = Joi.object().keys({
  title: Joi.string().required().messages({
    'string.base': 'Please add a gig title',
    'string.empty': 'Gig title is required',
    'any.required': 'Gig title is required'
  }),
  description: Joi.string().required().messages({
    'string.base': 'Please add a gig description',
    'string.empty': 'Gig description is required',
    'any.required': 'Gig description is required'
  }),
  categories: Joi.string().required().messages({
    'string.base': 'Please select a category',
    'string.empty': 'Gig category is required',
    'any.required': 'Gig category is required'
  }),
  subCategories: Joi.array().items(Joi.string()).required().min(1).messages({
    'string.base': 'Please add at least one subcategory',
    'string.empty': 'Gig subcategories are required',
    'any.required': 'Gig subcategories are required',
    'array.min': 'Please add at least one subcategory'
  }),
  tags: Joi.array().items(Joi.string()).required().min(1).messages({
    'string.base': 'Please add at least one tag',
    'string.empty': 'Gig tags are required',
    'any.required': 'Gig tags are required',
    'array.min': 'Please add at least one tag'
  }),
  price: Joi.number().required().greater(4.99).messages({
    'string.base': 'Please add a gig price',
    'string.empty': 'Gig price is required',
    'any.required': 'Gig price is required',
    'number.greater': 'Gig price must be greater than $4.99'
  }),
  coverImage: Joi.string().required().messages({
    'string.base': 'Please add a cover image',
    'string.empty': 'Gig cover image is required',
    'any.required': 'Gig cover image is required',
    'array.min': 'Please add a cover image'
  }),
  expectedDelivery: Joi.string().required().messages({
    'string.base': 'Please add expected delivery',
    'string.empty': 'Gig expected delivery is required',
    'any.required': 'Gig expected delivery is required',
    'array.min': 'Please add a expected delivery'
  }),
  basicTitle: Joi.string().required().messages({
    'string.base': 'Please add basic title',
    'string.empty': 'Gig basic title is required',
    'any.required': 'Gig basic title is required',
    'array.min': 'Please add a basic title'
  }),
  basicDescription: Joi.string().required().messages({
    'string.base': 'Please add basic description',
    'string.empty': 'Gig basic description is required',
    'any.required': 'Gig basic description is required',
    'array.min': 'Please add a basic description'
  })
});

export { gigCreateSchema, gigUpdateSchema };

/* @ Implemention with Zod */
/*
import { z } from 'zod';

// gigCreateSchema
export const gigCreateSchema = z.object({
  sellerId: z.string({
    required_error: 'Seller Id is required',
    invalid_type_error: 'Seller Id must be of type string'
  }).min(1, 'Seller Id is required'),

  profilePicture: z.string({
    required_error: 'Profile picture is required',
    invalid_type_error: 'Please add a profile picture'
  }).min(1, 'Profile picture is required'),

  title: z.string({
    required_error: 'Gig title is required',
    invalid_type_error: 'Please add a gig title'
  }).min(1, 'Gig title is required'),

  description: z.string({
    required_error: 'Gig description is required',
    invalid_type_error: 'Please add a gig description'
  }).min(1, 'Gig description is required'),

  categories: z.string({
    required_error: 'Gig category is required',
    invalid_type_error: 'Please select a category'
  }).min(1, 'Gig category is required'),

  subCategories: z.array(
    z.string({
      invalid_type_error: 'Subcategory must be a string'
    })
  , { required_error: 'Gig subcategories are required' })
    .min(1, 'Please add at least one subcategory'),

  tags: z.array(
    z.string({
      invalid_type_error: 'Tag must be a string'
    })
  , { required_error: 'Gig tags are required' })
    .min(1, 'Please add at least one tag'),

  price: z.number({
    required_error: 'Gig price is required',
    invalid_type_error: 'Please add a gig price'
  }).gt(4.99, { message: 'Gig price must be greater than $4.99' }),

  coverImage: z.string({
    required_error: 'Gig cover image is required',
    invalid_type_error: 'Please add a cover image'
  }).min(1, 'Gig cover image is required'),

  expectedDelivery: z.string({
    required_error: 'Gig expected delivery is required',
    invalid_type_error: 'Please add expected delivery'
  }).min(1, 'Gig expected delivery is required'),

  basicTitle: z.string({
    required_error: 'Gig basic title is required',
    invalid_type_error: 'Please add basic title'
  }).min(1, 'Gig basic title is required'),

  basicDescription: z.string({
    required_error: 'Gig basic description is required',
    invalid_type_error: 'Please add basic description'
  }).min(1, 'Gig basic description is required')
});

// gigUpdateSchema
export const gigUpdateSchema = z.object({
  title: z.string({
    required_error: 'Gig title is required',
    invalid_type_error: 'Please add a gig title'
  }).min(1, 'Gig title is required'),

  description: z.string({
    required_error: 'Gig description is required',
    invalid_type_error: 'Please add a gig description'
  }).min(1, 'Gig description is required'),

  categories: z.string({
    required_error: 'Gig category is required',
    invalid_type_error: 'Please select a category'
  }).min(1, 'Gig category is required'),

  subCategories: z.array(
    z.string({
      invalid_type_error: 'Subcategory must be a string'
    })
  , { required_error: 'Gig subcategories are required' })
    .min(1, 'Please add at least one subcategory'),

  tags: z.array(
    z.string({
      invalid_type_error: 'Tag must be a string'
    })
  , { required_error: 'Gig tags are required' })
    .min(1, 'Please add at least one tag'),

  price: z.number({
    required_error: 'Gig price is required',
    invalid_type_error: 'Please add a gig price'
  }).gt(4.99, { message: 'Gig price must be greater than $4.99' }),

  coverImage: z.string({
    required_error: 'Gig cover image is required',
    invalid_type_error: 'Please add a cover image'
  }).min(1, 'Gig cover image is required'),

  expectedDelivery: z.string({
    required_error: 'Gig expected delivery is required',
    invalid_type_error: 'Please add expected delivery'
  }).min(1, 'Gig expected delivery is required'),

  basicTitle: z.string({
    required_error: 'Gig basic title is required',
    invalid_type_error: 'Please add basic title'
  }).min(1, 'Gig basic title is required'),

  basicDescription: z.string({
    required_error: 'Gig basic description is required',
    invalid_type_error: 'Please add basic description'
  }).min(1, 'Gig basic description is required')
});
*/
