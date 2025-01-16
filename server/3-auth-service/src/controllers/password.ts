// Password controller that will contain the forgot password, reset password
// and also the change password functions

import crypto from 'crypto';

import { changePasswordSchema, emailSchema, passwordSchema } from '@auth/schemes/password';
import {
  getAuthUserByPasswordToken,
  getUserByEmail,
  getUserByUsername,
  updatePassword,
  updatePasswordToken
} from '@auth/services/auth.service';
import { BadRequestError, IAuthDocument, IEmailMessageDetails } from '@colson0x1/tradenexus-shared';
import { Request, Response } from 'express';
import { config } from '@auth/config';
import { publishDirectMessage } from '@auth/queues/auth.producer';
import { authChannel } from '@auth/server';
import { StatusCodes } from 'http-status-codes';
import { AuthModel } from '@auth/models/auth.schema';

// First, create the method that will send an email to the user when they want
// to request for the link to update their password
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  // Validate what we have on our req.body because the data we're going to
  // send, we need to validate them
  // i.e check if the email in the req.body matches what we expect. if not,
  // throw an error. if it does, use the email to get the user document.
  const { error } = await Promise.resolve(emailSchema.validate(req.body));
  if (error?.details) {
    throw new BadRequestError(error.details[0].message, 'Password forgotPassword() method error');
  }
  const { email } = req.body;
  // Get the user by email
  const existingUser: IAuthDocument | undefined = await getUserByEmail(email);
  // Check if the user with this `email` exists
  if (!existingUser) {
    // On the frontend, user will have to type in their email and then send.
    // And then we're going to send an email to that particular address. So
    // first we need to check if it is existing in the database.
    throw new BadRequestError('Invalid credentials', 'Password forgotPassword() method error');
  }
  // Generate some random characters so that it can be used it as the email
  // verification token
  // Here im generating random buffer of size 20 and convert the buffer into
  // hexa decimal string
  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  const randomCharacters: string = randomBytes.toString('hex');
  const date: Date = new Date();
  // Just adding one hour to the token to the date which im going to set as
  // the token expiration date.
  // So the current hour + 1
  date.setHours(date.getHours() + 1);
  // This will set the properties on the database
  await updatePasswordToken(existingUser.id!, randomCharacters, date);
  // Create the reset link
  // So this is going to be the URL that the user will have to click on.
  const resetLink = `${config.CLIENT_URL}/reset_password?token=${randomCharacters}`;
  // Construct email messages detail
  const messageDetails: IEmailMessageDetails = {
    receiverEmail: existingUser.email,
    resetLink,
    username: existingUser.username,
    template: 'forgotPassword'
  };
  // Publish message to the tradenexus-email-notification exchange
  await publishDirectMessage(
    authChannel,
    'tradenexus-email-notification',
    'auth-email',
    JSON.stringify(messageDetails),
    'Forgot password message sent to notification service.'
  );
  res.status(StatusCodes.OK).json({ message: 'Password reset email sent.' });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  // Validate new password and confirm password
  const { error } = await Promise.resolve(passwordSchema.validate(req.body));
  if (error?.details) {
    throw new BadRequestError(error.details[0].message, 'Password resetPassword() method error');
  }

  const { password, confirmPassword } = req.body;
  const { token } = req.params;
  // If passwords are not same, then throw error
  if (password !== confirmPassword) {
    throw new BadRequestError('Passwords do not match', 'Password resetPassword() method error');
  }

  // But if the passwords are the same, then we want to use the token i.e we
  // want to get the user object by the token
  const existingUser: IAuthDocument | undefined = await getAuthUserByPasswordToken(token);
  // If no document is returned, that means the token is invalid
  if (!existingUser) {
    throw new BadRequestError('Reset token has expired', 'Password resetPassword() method error');
  }
  // Otherwise, hash the password
  // use hashPassword() to has this new `password`
  const hashedPassword: string = await AuthModel.prototype.hashPassword(password);
  // Update the database with the new password
  // To this updatePassword(), we pass in the id and the new hashed password
  await updatePassword(existingUser.id!, hashedPassword);
  // Construct email messages detail
  const messageDetails: IEmailMessageDetails = {
    username: existingUser.username,
    template: 'resetPasswordSuccess'
  };
  // Publish message to the tradenexus-email-notification exchange
  await publishDirectMessage(
    authChannel,
    'tradenexus-email-notification',
    'auth-email',
    JSON.stringify(messageDetails),
    'Reset password success message sent to notification service.'
  );
  res.status(StatusCodes.OK).json({ message: 'Password successfully updated.' });
}

// This method will be called when user is already logged in
// The only difference between the `resetPassword` and the `changePassword`
// is for the `changePassword`, im using current password and the new password.
// And then instead of getting the user documents by token, im getting the
// user document by the username and im getting the username from currentUser.
export async function changePassword(req: Request, res: Response): Promise<void> {
  // For the validation, We expect current password and the new password
  const { error } = await Promise.resolve(changePasswordSchema.validate(req.body));
  if (error?.details) {
    throw new BadRequestError(error.details[0].message, 'Password changePassword() method error');
  }

  const { currentPassword, newPassword } = req.body;
  if (currentPassword !== newPassword) {
    throw new BadRequestError('Invalid password', 'Password changePassword() method error');
  }

  // This method changePassword() will be called when the user is already
  // logged in. So here, using getUserByUsername()
  // Also, note: as long as the user is logged in, we have this `currentUser`
  // object and inside of it, we have the id, email, username like that.
  // So im going to use this currentUser to get the user.
  const existingUser: IAuthDocument | undefined = await getUserByUsername(`${req.currentUser?.username}`);
  if (!existingUser) {
    throw new BadRequestError('Invalid password', 'Password changePassword() method error');
  }
  // Hash the password with the `newPassword`
  const hashedPassword: string = await AuthModel.prototype.hashPassword(newPassword);
  // Update the database with the new password
  // To this updatePassword(), we pass in the id and the new hashed password
  await updatePassword(existingUser.id!, hashedPassword);
  // Construct email messages detail
  const messageDetails: IEmailMessageDetails = {
    username: existingUser.username,
    template: 'resetPasswordSuccess'
  };
  // Publish message to the tradenexus-email-notification exchange
  await publishDirectMessage(
    authChannel,
    'tradenexus-email-notification',
    'auth-email',
    JSON.stringify(messageDetails),
    'Password change success message sent to notification service.'
  );
  res.status(StatusCodes.OK).json({ message: 'Password successfully updated.' });
}
