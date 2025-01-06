import Joi, { ObjectSchema } from 'joi';

const loginSchema: ObjectSchema = Joi.object().keys({
  // validation for login: either it should be a username or an email and
  // that should validate the specified constraints down here
  // So if its a valid email then the condition for validation will succeed,
  // otherwise it will fail. Likewise same for username.
  username: Joi.alternatives().conditional(Joi.string().email(), {
    then: Joi.string().email().required().messages({
      'string.base': 'Email must be of type string',
      'string.email': 'Invalid email',
      'string.empty': 'Email is a required field'
    }),
    otherwise: Joi.string().min(4).max(12).required().messages({
      'string.base': 'Username must be of type string',
      'string.min': 'Invalid username',
      'string.max': 'Invalid username',
      'string.empty': 'Username is a required field'
    })
  }),
  password: Joi.string().min(4).max(12).required().messages({
    'string.base': 'Password must be of type string',
    'string.min': 'Invalid invalid password',
    'string.max': 'Invalid invalid password',
    'string.empty': 'Password is a required field'
  })
});

export { loginSchema };
