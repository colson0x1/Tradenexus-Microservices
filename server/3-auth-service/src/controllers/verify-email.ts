import { getAuthUserById, getAuthUserByVerificationToken, updateVerifyEmailField } from '@auth/services/auth.service';
import { BadRequestError, IAuthDocument } from '@colson0x1/tradenexus-shared';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export async function update(req: Request, res: Response): Promise<void> {
  const { token } = req.body;
  // Check if the document exists by this token
  const checkIfUserExist: IAuthDocument | undefined = await getAuthUserByVerificationToken(token);
  // If no document, then throw error
  if (!checkIfUserExist) {
    throw new BadRequestError('Verification token is either invalid or is already used.', 'VerifyEmail update() method error');
  }
  // .i.e If no document is returned based on the token, the token is either
  // invalid or is already used
  // Otherwise update this `updateVerifyEmail()` field (auth.service.ts)
  // By default, `emailVerified` filed is 0. Now update it to 1.
  // 1 indicates true.
  // And for the token, I set this to an empty string i.e '' because this will
  // be used to update the email verified. So once this is called successfully
  // then the user will automatically be verified.
  await updateVerifyEmailField(checkIfUserExist.id!, 1, '');
  // Get updated user document
  const updatedUser = await getAuthUserById(checkIfUserExist.id!);
  // Send the response
  res.status(StatusCodes.OK).json({ message: 'Email verified successfully.', user: updatedUser });
}
