/* @ Create user service method */
// Create a user and then when the user is created, send or publish a
// message to an exchange
// When user creates an account, they automatically becomes a buyer. And im
// going to have a separate service to manage buyers and sellers. And each
// buyer will be added to a MongoDB database and then each seller will be
// added to a MongoDB database. So once i create a user and the user creation
// is successful, im going to publish an event to a buyer exchange.

import { AuthModel } from '@auth/models/auth.schema';
import { publishDirectMessage } from '@auth/queues/auth.producer';
import { authChannel } from '@auth/server';
import { firstLetterUppercase, IAuthBuyerMessageDetails, IAuthDocument } from '@colson0x1/tradenexus-shared';
import { lowerCase, omit } from 'lodash';
import { Model, Op } from 'sequelize';

// `data` of type `IAuthDocument` contains all the properties that we need that
// we want to save to our database
export async function createAuthUser(data: IAuthDocument): Promise<IAuthDocument> {
  // create a user and then return a model
  const result: Model = await AuthModel.create(data);
  // Inside that `result` model, we're going to get `.dataValues` and that
  // dataValues will contain our IAuthDocument
  /* result.dataValues. */
  // Every user that creates an account will automatically be a buyer.
  // Construct the message details object that im going to send to the buyer
  // service.
  // This `messageDetails` will be used to create new buyer. So here in this
  // MySQL database, im just going to add the documents or the data for the
  // user. But then to create the actual buyer, im going to add it to the
  // MongoDB.
  // I'll use the type `IAuthBuyerMessageDetails` to create the object in the
  // MongoDB database.
  const messageDetails: IAuthBuyerMessageDetails = {
    // This `dataValues`, we're getting it from the Model. Because the
    // `create` method returns a Model. It does not return the actual document.
    // It returns a Model and inside that Model it contains this `dataValue`
    // that contains the actual document that was added to the database or to
    // the table.
    // So that is why im using `result.dataValues`
    username: result.dataValues.username!,
    email: result.dataValues.email!,
    // here using `!` incase its undefined
    profilePicture: result.dataValues.profilePicture!,
    country: result.dataValues.country!,
    createdAt: result.dataValues.createdAt!,
    // The reasons why im doing this `type: 'auth'` is to check, if type is
    // equal to 'auth', we know exactly that its coming from the 'auth' service
    type: 'auth'
  };
  // publish the message
  await publishDirectMessage(
    // channel
    authChannel,
    // exchange name
    'tradenexus-buyer-update',
    // routing key
    'user-buyer',
    // message
    JSON.stringify(messageDetails),
    // log value
    'Buyer details sent to buyer service'
  );
  // We don't want to return the `password`. So the documents that is returned
  // from `result.dataValues`, we need to omit the `password` field
  // i.e we dont want to send the password to the frontend
  // i.e This will return the complete row for that particular user and we
  // don't want the password to be sent. So here we omit the password and then
  // return the user data.
  const userData: IAuthDocument = omit(result.dataValues, ['password']) as IAuthDocument;
  // return user document
  return userData;
}

// export user by id
// here we can return a Promise. There are two ways we can do it. We can either
// return a Promise or we return this Model. And then wherever we need to use
// it, we can just return and get what we need from that value
/*
export async function getAuthUserById(authId: number): Promise<Model<IAuthDocument>> {
  // To get the user by id, we use the findOne
  const user: Model<IAuthDocument> = (await AuthModel.findOne({
    // we want to find by `id` where id in the database is equal to the authId
    // so we want to find one where id matches whatever id we pass in in the
    // authId, but we want to exclude also the password. we dont want it to
    // return the password
    where: { id: authId },
    // exclude password
    attributes: {
      exclude: ['password']
    }
  })) as Model<IAuthDocument>;
  return user;
}
*/
// OR this way makes more sense!
// So here, we're returning the actual document i.e `IAuthDocument`, not the
// `Model` itself
export async function getAuthUserById(authId: number): Promise<IAuthDocument> {
  // To get the user by id, we use the findOne
  const user: Model = (await AuthModel.findOne({
    // we want to find by `id` where id in the database is equal to the authId
    // so we want to find one where id matches whatever id we pass in in the
    // authId, but we want to exclude also the password. we dont want it to
    // return the password
    where: { id: authId },
    // exclude password
    attributes: {
      exclude: ['password']
    }
  })) as Model;
  return user.dataValues;
}

export async function getUserByUsernameOrEmail(username: string, email: string): Promise<IAuthDocument> {
  // So here what i want to do is, check if theres any document that matches
  // the username or the email properties. Here since we're not going to send
  // this data to the fontend, we can remove the `attributes` property
  const user: Model = (await AuthModel.findOne({
    where: {
      // Here we want to get the documents that matches the username  and
      // email
      // i.e we're just saying, if we want to check for any document that
      // matches the username or email. So if theres a docment that matches the
      // username it will return the document. Likewise, if theres a document
      // that matches the email, it will reutrn the document. If it doesnt find,
      // then it will just return empty.
      [Op.or]: [{ username: firstLetterUppercase(username) }, { email: lowerCase(email) }]
    }
  })) as Model;
  return user.dataValues;
}

// Also implement, get by username and then get by email separately
// @ Get by username
export async function getUserByUsername(username: string): Promise<IAuthDocument> {
  const user: Model = (await AuthModel.findOne({
    where: { username: firstLetterUppercase(username) }
  })) as Model;
  return user.dataValues;
}

// @ Get by email
export async function getUserByEmail(email: string): Promise<IAuthDocument> {
  const user: Model = (await AuthModel.findOne({
    where: { email: lowerCase(email) }
  })) as Model;
  return user.dataValues;
}

// Will be used to verify the user's email
export async function getAuthUserByVerificationToken(token: string): Promise<IAuthDocument> {
  const user: Model = (await AuthModel.findOne({
    // Search where email verification token matches token
    where: { emailVerificationToken: token },
    // And here we can decide to exclude the password.
    attributes: {
      exclude: ['password']
    }
  })) as Model;
  return user.dataValues;
}

// This will be if the user is already logged in and they want to update their
// password
export async function getAuthUserByPasswordToken(token: string): Promise<IAuthDocument> {
  const user: Model = (await AuthModel.findOne({
    // In this case we're going to use a `&` operator because we want to return
    // a document that matches both the `passwordResetToken` and the
    // `passwordResetExpires`
    where: {
      // here on `passwordResetExpires`, if its greater than the current time,
      // then it has not expired.
      // I had set `passwordResetExpires` to `new Date()` on auth.schema.ts so
      // im checking if the `passwordResetExpires` is not greater than the
      // current date
      [Op.and]: [{ passwordResetToken: token }, { passwordResetExpires: { [Op.gt]: new Date() } }]
    }
  })) as Model;
  return user.dataValues;
}
