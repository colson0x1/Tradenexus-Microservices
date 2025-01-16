// For Signin, we just validate the `req.body` and then we check if the email
// is correct or not.

import { AuthModel } from '@auth/models/auth.schema';
import { loginSchema } from '@auth/schemes/signin';
import { getUserByEmail, getUserByUsername, signToken } from '@auth/services/auth.service';
import { BadRequestError, IAuthDocument, isEmail } from '@colson0x1/tradenexus-shared';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { omit } from 'lodash';

export async function read(req: Request, res: Response): Promise<void> {
  // @ Validate req.body
  // NOTE: As coded in signin.ts scheme, the request body has field `username`
  // and that could be iether be an email or a username string.
  const { error } = await Promise.resolve(loginSchema.validate(req.body));
  if (error?.details) {
    throw new BadRequestError(error.details[0].message, 'SignIn read() method error');
  }

  const { username, password } = req.body;
  // Check the `username` field if its an email or if its a regular string
  const isValidEmail: boolean = isEmail(username);
  // If its not an email then we get the user data by the username or if its
  // an email, we get the user data by the email
  const existingUser: IAuthDocument | undefined = !isValidEmail
    ? await getUserByUsername(username)
    : ((await getUserByEmail(username)) as IAuthDocument);
  // If it does not return any data error by username or email that means
  // the user does not exist so we need to throw new bad request error.
  if (!existingUser) {
    // If no object is returned from `existingUser`, we throw an error.
    // So if `existingUser` does not return any document then I will throw new
    // bad request error.
    throw new BadRequestError('Invalid credentials', 'SignIn read() method error');
  }

  // If object is returned from `existingUser`, we compare the password.
  // @ Check if the passwords match now.
  // So if existingUser returns an object then we need to compare the passwords
  // Here send the `password` to the `comparePassword()` that the user is
  // sending from the frontend and then pass in the `existingUser` password.
  // `existingUser.password` is the password of the existingUser form the DB.
  const passwordsMatch: boolean = await AuthModel.prototype.comparePassword(password, `${existingUser.password}`);
  // If password doesn't match, we throw an error
  if (!passwordsMatch) {
    throw new BadRequestError('Invalid credentials', 'SignIn read() method error');
  }

  // But if passwords match, we sign the token and then we omit the password
  // i.e We dont want to send the password along with the documents to the API
  // gateway, and then to the frontend.
  const userJWT: string = signToken(existingUser.id!, existingUser.email!, existingUser.username!);
  // Im not omitting the password in `getUserByUsername()` and `getUserByEmail()`
  // inside auth.service.ts
  // We want to omit the password here when sending the existing user object
  // i.e We dont want to send the password so
  // omit takes first argument of which document to omit from and second argument
  // is what we want to omit i.e password
  const userData: IAuthDocument = omit(existingUser, ['password']);
  res.status(StatusCodes.OK).json({ message: 'User login successfully', user: userData, token: userJWT });
}
