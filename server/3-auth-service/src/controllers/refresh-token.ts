// Refresh token is just going to be a controller with the function.
// Here, we check or get the user by a username and then if it exists, we sign
// the token and then return the data to the API gateway.

import { getUserByUsername, signToken } from '@auth/services/auth.service';
import { IAuthDocument } from '@colson0x1/tradenexus-shared';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

// @ Simply get the user by username
// i.e Its task is to get the user that we are going to pass in the params
// f getUserByUsername(), get the object, sign the token and then send it back
// to the API gateway.
export async function token(req: Request, res: Response): Promise<void> {
  const existingUser: IAuthDocument | undefined = await getUserByUsername(req.params.username);
  // Here we can do a check if existingUser returns any object. But i'll
  // simply sign the token here
  const userJWT: string = signToken(existingUser!.id!, existingUser!.email!, existingUser!.username!);
  res.status(StatusCodes.OK).json({ message: 'Refresh token', user: existingUser, token: userJWT });
}
