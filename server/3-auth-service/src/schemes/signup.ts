import Joi, { ObjectSchema } from 'joi';

const signupSchema: ObjectSchema = Joi.object().keys({
  username: Joi.string().min(4).max(12).required().messages({
    // Error object is usually returned from joy. The base message is inside
    // this key `string.base`. So that is what we want to change
    // i.e `string.base` is going to be the error message if the username
    // is not a string.
    'string.base': 'Username must be of type string',
    // `string.min` is going to be the error message if it does not meet the
    // specified minimum criteria
    'string.min': 'Invalid username',
    'string.max': 'Invalid username',
    'string.empty': 'Username is a required field'
  }),
  password: Joi.string().min(4).max(12).required().messages({
    'string.base': 'Password must be of type string',
    'string.min': 'Invalid invalid password',
    'string.max': 'Invalid invalid password',
    'string.empty': 'Password is a required field'
  }),
  country: Joi.string().required().messages({
    'string.base': 'Country must be of type string',
    'string.empty': 'Country is a required field'
  }),
  email: Joi.string().email().required().messages({
    'string.base': 'Email must be of type string',
    'string.email': 'Invalid email',
    'string.empty': 'Email is a required field'
  }),
  profilePicture: Joi.string().required().messages({
    'string.base': 'Please add a profile picture',
    'string.email': 'Profile picture is required',
    'string.empty': 'Profile picture is required'
  })
});

export { signupSchema };
