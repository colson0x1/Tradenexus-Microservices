import Joi, { ObjectSchema } from 'joi';

// If the user wants to reset their password, we need to validate the email
// that the user will send. Because if they want to request for a password
// reset link, they will need to add their email. So this email schema will
// be used to validate that particular email field.
const emailSchema: ObjectSchema = Joi.object().keys({
  email: Joi.string().email().required().messages({
    'string.base': 'Field must be valid',
    'string.required': 'Field must be valid',
    'string.email': 'Field must be valid'
  })
});

// When they add the password, they are going to send the password and the
// confirm password. The confirmPassword field must match the password field.
// So the confirmPassword here makes reference to the password.
// So this here will be used if the user is not yet logged in but they want
// to change their password.
const passwordSchema: ObjectSchema = Joi.object().keys({
  password: Joi.string().required().min(4).max(12).messages({
    'string.base': 'Password should be of type string',
    'string.min': 'Invalid password',
    'string.max': 'Invalid password',
    'string.empty': 'Password is a required field'
  }),
  confirmPassword: Joi.string().required().valid(Joi.ref('password')).messages({
    'any.only': 'Passwords should match',
    'any.required': 'Confirm password is a required field'
  })
});

// This will be used if the user is already logged in and they go to their
// settings page to change their password. They must pass in their current
// password and their new password.
const changePasswordSchema: ObjectSchema = Joi.object().keys({
  currentPassword: Joi.string().required().min(4).max(8).messages({
    'string.base': 'Password should be of type string',
    'string.min': 'Invalid password',
    'string.max': 'Invalid password',
    'string.empty': 'Password is a required field'
  }),
  newPassword: Joi.string().required().min(4).max(12).messages({
    'string.base': 'Password should be of type string',
    'string.min': 'Invalid password',
    'string.max': 'Invalid password',
    'string.empty': 'Password is a required field'
  })
});

export { emailSchema, passwordSchema, changePasswordSchema };
