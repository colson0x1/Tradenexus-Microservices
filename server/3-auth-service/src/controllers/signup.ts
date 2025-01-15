// Use schema to validate inputs coming from req.body because we're using a
// POST request so we pass the data through req.body. If it does not meet the
// criteria, we send a requst or an error message. And then if it succeeds, we
// need to check  the email or the password if it already exists on the database?
// If it already exists but if there error on the email or username, we throw
// an error telling user that its invalid credentials.
// Then if that part succeeds, we need to upload the users profile picture. If
// it fails, we throw an error and if it succeeds, we then add the data to the
// database. Also publish another message which is about email notification.

import crypto from 'crypto';

import { signupSchema } from '@auth/schemes/signup';
import { createAuthUser, getUserByUsernameOrEmail, signToken } from '@auth/services/auth.service';
import {
  BadRequestError,
  firstLetterUppercase,
  IAuthDocument,
  IEmailMessageDetails,
  uploads,
  winstonLogger
} from '@colson0x1/tradenexus-shared';
import { UploadApiResponse } from 'cloudinary';
import { Request, Response } from 'express';
import { v4 as uuidV4 } from 'uuid';
import { lowerCase } from 'lodash';
import { config } from '@auth/config';
import { publishDirectMessage } from '@auth/queues/auth.producer';
import { authChannel } from '@auth/server';
import { StatusCodes } from 'http-status-codes';
import { Logger } from 'winston';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authSignUp', 'debug');

export async function create(req: Request, res: Response): Promise<void> {
  try {
    log.info('Auth signup controller - start');
    log.info('Validating request body');

    // Validate the data
    // If we want to return a Promisified response, then we can use
    // Promise.resolve i.e if we want to resolve the response of maybe of a return
    // data, that is not a promise, we can call it inside Promise.resolve()
    // Here on `signupSchema.validate`, I want the method to be the response to
    // be returned as a Promise.
    // Joy has two types of validation method: asynchronous and synchronous.
    // The `validate` is synchronous and `validAsync` is asyncnronous. Here, I
    // want to use the validate which is synchronous. But I want the result to
    // be returned as a Promise so thats why I passed it as `Promise.resolve`
    const { error } = await Promise.resolve(signupSchema.validate(req.body));
    // So now this `error` object, it contains property called `details`.
    // If there's an error, the `details` property will be included in the error
    // object. But if there is no error, its going to be null or undefined.
    if (error?.details) {
      log.info('Checking if user exists');

      // details is going to be an array
      throw new BadRequestError(error.details[0].message, 'SignUp create() method error');
    }
    const { username, email, password, country, profilePicture } = req.body;
    log.info('Checking if user exists');

    // Else if there is no error, we need to check if the username or email
    // already exists
    const checkIfUserExist: IAuthDocument = await getUserByUsernameOrEmail(username, email);
    if (checkIfUserExist) {
      log.error('User already exists');

      // If username or email exists, that means we have data. So we throw an
      // error that will be displayed to the user on the frontend
      throw new BadRequestError('Invalid credentials. Email or Username', 'SignUp create() method error');
    }

    // Now if everything is fine, we need to upload the profile picture. For this
    // profile picture, im going to use base64 encoded string. So from the frontend,
    // I'll send the base64 encoded string.
    // We need to generate this `profilePublicId` and for that im going to use
    // `uuid`. Im using uuid to generate alphanumeric character.
    // Here about profilePublicId, we don't want cloudinary to generate the
    // public id for us because this is a profile picture. So we want to use the
    // same id because we want the user to be able to update it multiple times.
    // If we allow Cloudinary, to generate the profile id, and then we use the
    // URL that it displays that it gives to us, then when the user updates,
    // the profile picture is going to enerate another URL with a different profile
    // id. But if we generate our own profile public id every time we update, we
    // are still going to be using the same profile id or public id. It's not
    // going to change. That is the reason why im using this `profilePublicId`
    const profilePublicId = uuidV4();
    // using `uploads` method to upload to cloudinary which is defined on
    // cloudinary-upload.ts
    // Here, we set overwrite to true so if the user creates the profile picture
    // the first time and then the user updates the profile picture, we are still
    // going to maintain the same publicId but with overwrite true, we want the
    // previous image to be overwritten with the new one, and if the image is in
    // the cache, we want to invalidate it.
    const uploadResult: UploadApiResponse = (await uploads(profilePicture, `${profilePublicId}`, true, true)) as UploadApiResponse;
    // If its successful, then its going to return an object that contains
    // `public_id` but if theres an error, then `publicId` will not be inside
    // this uploadResult.
    if (!uploadResult.public_id) {
      log.error('File upload failed');

      // So if it does not contain `public_id`, throw this error
      throw new BadRequestError('File upload error. Try again', 'SignUp create() method error');
    }

    log.info('Creating auth user');

    // Generate some random characters so that it can be used it as the email
    // verification token
    // Here im gernerating random buffer of size 20 and convert the buffer into
    // hexa decimal string
    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomCharacters: string = randomBytes.toString('hex');
    // Construct data that will be saved to the database
    const authData: IAuthDocument = {
      username: firstLetterUppercase(username),
      email: lowerCase(email),
      profilePublicId,
      password,
      country,
      // Once the image is uploaded successfully, we get this secure URL i.e https
      profilePicture: uploadResult?.secure_url,
      emailVerificationToken: randomCharacters
    } as IAuthDocument;
    // here createAuthUser will create the user and then return user document
    // i.e IAuthDocument
    // Now once it creates the user, it will send this to the tradenexus buyer
    // exchange
    const result: IAuthDocument = await createAuthUser(authData);
    log.info('User created successfully');

    // Now we need to construct our verification URL because we need to send
    // a message to the notification service so that it can send a verification
    // email to the user.
    // So this is going to be the URL that the user needs to click on that will
    // take them to the page where they need to verify their email.
    const verificationLink = `${config.CLIENT_URL}/confirm_email?v_token=${authData.emailVerificationToken}`;
    // Construct message details that will be passed to the publishMessage fn
    const messageDetails: IEmailMessageDetails = {
      receiverEmail: result.email,
      verifyLink: verificationLink,
      template: 'verifyEmail'
    };
    // The exchange name, routing key and auth email is on `email.consumer.ts` from
    // the notification service
    log.info('Publishing email notification');

    await publishDirectMessage(
      authChannel,
      'tradenexus-email-notification',
      'auth-email',
      JSON.stringify(messageDetails),
      'Verify email message has been sent to notification service.'
    );
    // Send the response to the API Gateway
    // When we create a new data, the HTTP status code that is returned is usually
    // 201.
    // Sign token down here
    // So this will generate the JWT token.
    // NOTE: Im not storing the JWT token in the cookie related to the
    // auth service. Instead, it is stored in the API gateway. So we send this
    // cookie to the API gateway. Not to the client, not to the frontend but to
    // the API gateway. And then the API gateway will store it. It will be stored
    // in the cookie inside API gateway.
    const userJWT: string = signToken(result.id!, result.email!, result.username!);
    log.info('Auth signup controller - end');

    res.status(StatusCodes.CREATED).json({ message: 'User created successfuly', user: result, token: userJWT });
  } catch (error) {
    log.error('Auth signup controller error:', error);
    throw error;
  }
}
