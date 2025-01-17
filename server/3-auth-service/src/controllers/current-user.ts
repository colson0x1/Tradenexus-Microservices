import crypto from 'crypto';

import { getAuthUserById, getUserByEmail, updateVerifyEmailField } from '@auth/services/auth.service';
import { BadRequestError, IAuthDocument, IEmailMessageDetails } from '@colson0x1/tradenexus-shared';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { lowerCase, parseInt } from 'lodash';
import { config } from '@auth/config';
import { publishDirectMessage } from '@auth/queues/auth.producer';
import { authChannel } from '@auth/server';

// @ Get the user data
// This method will be in the protected route and then if we make a request,
// if the token is invalid, then it will return an error. But if it is valid,
// it will return the actual user data.
// i.e Its just going to be used to check if the user is still authenticated!
// So the user might be on a particular page but the token has expired. So if
// user visits another page, we make a request and this will check if the token
// is still valid by trying to get the data from the database. If it doesn't
// get any data then the token is not valid. If it does, then the token is valid.
export async function read(req: Request, res: Response): Promise<void> {
  let user = null;
  // For authenticated user, we still have access to currentUser object
  const existingUser: IAuthDocument | undefined = await getAuthUserById(req.currentUser!.id);
  // In JS, if we want to check an object has keys, we use Object.keys()
  // It returns it in an array and here we check the length.
  if (Object.keys(existingUser!).length) {
    user = existingUser;
  }
  res.status(StatusCodes.OK).json({ message: 'Authenticated user', user });
}

// Method that the user will call when they want to resend the verification
// email.
// Note: The verification email will only be requested for when the user has
// logged in. So when the user creates an account and they don't verify their
// email, they will still be logged in. But on the page in the application,
// they will see a banner asking them to go and validate or verify their
// password or rather their email.
// So this will be called when the user is logged in
export async function resendEmail(req: Request, res: Response): Promise<void> {
  const { email, userId } = req.body;
  const checkIfUserExist: IAuthDocument | undefined = await getUserByEmail(lowerCase(email));
  if (!checkIfUserExist) {
    throw new BadRequestError('Email is invalid', 'CurrentUser resentEmail() method error');
  }
  // Generate some random characters so that it can be used it as the email
  // verification token
  // Here im generating random buffer of size 20 and convert the buffer into
  // hexa decimal string
  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  const randomCharacters: string = randomBytes.toString('hex');

  // So here we want to send a new link to the users email so they can click
  // on it.
  const verificationLink = `${config.CLIENT_URL}/confirm_email?v_token=${randomCharacters}`;
  // Update user email field with the value 0 but with this new  randomCharacters.
  await updateVerifyEmailField(parseInt(userId), 0, randomCharacters);

  const messageDetails: IEmailMessageDetails = {
    receiverEmail: lowerCase(email),
    verifyLink: verificationLink,
    template: 'verifyEmail'
  };
  await publishDirectMessage(
    authChannel,
    'tradenexus-email-notification',
    'auth-email',
    JSON.stringify(messageDetails),
    'Verify email message has been sent to notification service.'
  );
  // Get updated user
  // Im using parseInt here because the userId from the request body above
  // is going to be coming as a string. So I just need to parse it into an
  // integer.
  const updatedUser = await getAuthUserById(parseInt(userId));

  res.status(StatusCodes.OK).json({ message: 'Email verification sent', user: updatedUser });
}
