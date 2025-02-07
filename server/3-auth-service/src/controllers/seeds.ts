import crypto from 'crypto';

import { createAuthUser, getUserByUsernameOrEmail } from '@auth/services/auth.service';
import { BadRequestError, firstLetterUppercase, IAuthDocument, lowerCase } from '@colson0x1/tradenexus-shared';
import { faker } from '@faker-js/faker';
import { Request, Response } from 'express';
import { generateUsername } from 'unique-username-generator';
import { v4 as uuidV4 } from 'uuid';
import { sample } from 'lodash';
import { StatusCodes } from 'http-status-codes';

// @ Controller method that can be used to generate seed users.
export async function create(req: Request, res: Response): Promise<void> {
  // The only params i want to have is `count`. So the number of seed data
  // to create like 5 or 10.
  // And the API on the URL, we're going to have this `count` params.
  const { count } = req.params;
  // Construct the username
  const usernames: string[] = [];
  // Use `count` property to loop and then add all the usernames to this
  // `usernames` array.
  // Note: any property we're passing into params will always be a string but
  // we want count as a number so
  for (let i = 0; i < parseInt(count, 10); i++) {
    // '' is separator, 0 is random digit and 12 is username length. 12 because
    // in validation, i have set  maxValue for username to 12.
    // Im using this library to generate username because for the latest version
    // of faker, they remove the case where we can create usernames i.e method
    // was removed to create usernames on latest verison of faker library.
    const username: string = generateUsername('', 0, 12);
    usernames.push(firstLetterUppercase(username));
  }

  // So now, whatever the count is, im going to create the usernames based on
  // the count and then add it to the `usernames` list. And then, im going
  // to use this username list to create the actual user data and then send
  // it to MySQL database.
  // So at first, i create the usernames based on the count. So if the count
  // is say 20, that means, im going to create 20 usernames. and then, i use
  // the usernames list to loop. So for each of those username, im going to
  // create a document or a row in the MySQL database.
  for (let i = 0; i < usernames.length; i++) {
    const username = usernames[i];
    // Create an email with faker library
    const email = faker.internet.email();
    // For password, I will use the same password so that if in canse i want to
    // log in, then i will remember the password name
    // I dont want to use the random passwords, because if i use random password,
    // i will not be able to see the password in the database.
    // So with this, I know that all users will have the same password, all the
    // seed data. So I can log in with any user so that I can remember.
    const password = 'stillhome';
    const country = faker.location.county();
    const profilePicture = faker.image.urlPicsumPhotos();

    // Now for every user that is created, check if it already exists
    const checkIfUserExist: IAuthDocument | undefined = await getUserByUsernameOrEmail(username, email);
    if (checkIfUserExist) {
      /* log.error('User already exists'); */

      // If username or email exists, that means we have data. So we throw an
      // error that will be displayed to the user on the frontend
      throw new BadRequestError('Invalid credentials. Email or Username', 'Seed create() method error');
    }

    const profilePublicId = uuidV4();
    // Im not going to upload to cloudinary because im generating a fake data
    // using this `urlPicsumPhotos()`;
    // Create some random characters
    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomCharacters: string = randomBytes.toString('hex');
    // Here, im not going to publish any message too since its seed data.
    // So what im going to do instead is construct `IAuthData`
    // Construct data that will be saved to the database
    const authData: IAuthDocument = {
      username: firstLetterUppercase(username),
      email: lowerCase(email),
      profilePublicId,
      password,
      country,
      // Once the image is uploaded successfully, we get this secure URL i.e https
      profilePicture,
      emailVerificationToken: randomCharacters,
      // Randomly select 0 or 1 for email verification status. Im using lodash
      // library here to always randomly select 0 or 1.
      emailVerified: sample([0, 1])
    } as IAuthDocument;
    await createAuthUser(authData);
  }

  // Here, we don't need to worry about any token
  // This will not be sent to the client. So only just will send a request from
  // the API gateway so that we can have users in the database.
  // And im only creating for the MySQL database.
  res.status(StatusCodes.OK).json({ message: 'Seed users created successfully.' });
}
