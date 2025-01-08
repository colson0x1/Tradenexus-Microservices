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
import { IAuthBuyerMessageDetails, IAuthDocument } from '@colson0x1/tradenexus-shared';
import { omit } from 'lodash';
import { Model } from 'sequelize';

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
