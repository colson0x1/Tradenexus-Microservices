/* @ Buyer Schema */
// That data for buyer that will be sent from the Auth Service is located in
// `auth service -> /src/services/auth.service.ts` inside `messageDetails`.
// + I'm adding few more information on top of `messageDetails` data to this
// buyer schema.
// So here, im creating schema for the information that im sending from the
// Auth Service.

import { IBuyerDocument } from '@colson0x1/tradenexus-shared';
import mongoose, { model, Model, Schema } from 'mongoose';

const buyerSchema: Schema = new Schema(
  {
    // The reason why Im adding index to `username` is because im going to
    // create a function to search for buyer document by `username`. So that
    // is why im indexing this `username` property.
    username: { type: String, required: true, index: true },
    // Also indexing `email` as well.
    email: { type: String, required: true, index: true },
    // I dont need to index `profilePicture`. Because im not going to search
    // for buyer documents using profile picture. So this is not going to be
    // indexed.
    /* @ Make a username and email changable later */
    // NOTE!: the `username` and `email` as in buyer.schema.ts and seller.schema.ts,
    // so once the user is created, username and email cannot be changed i.e
    // they will not be able to update them.
    // The current approach im using there i.e
    // {
    //  username: { type: String, required: true, index: true }
    //  emial: { type: String, required: true, index: true }
    // }
    // That approach doesnt make sense if, users can have the option of
    // updating or changing their usernames or emails.
    // So that approach won't make sense because, if they use it multiple
    // times right there in the schema, it will probably like be challenged
    // if they update their username or update their emails and the different
    // collections, we have to look for where they were updated in different
    // collections and then update it. So it doesn't make sense that way.
    // Approach!
    // So if we plan on creating an application whereby the username can be
    // updated later once they are created or the email, then above approach
    // will not be good. What we can do is, we create a separate collection.
    // And then we reference the `username` and the `email` in whereever,
    // whatever collection we need to use them. So for example, we can create
    // a separate collections to add usernames and email. And then there i.e
    // in buyer.schema.ts and seller.schema.ts, we just reference the
    // username and the email. So if we update the collection, it will reflect
    // in all the other collections or documents where the username and the
    // emails are used.
    // So the reason why I added like that is because users will not be able
    // to update their username and email.
    profilePicture: { type: String, required: true },
    country: { type: String, required: true },
    // By default, this `isSeller` property for every document that is created
    // is set to false. And then when a user creates a seller's account, im
    // going to update it from false to true.
    isSeller: { type: Boolean, default: false },
    // `purchasedGigs` is going to be an array. Its going to contain the `id`
    // of all the gigs that the user purchased.
    // And the reason why im setting this `ref` to `Gig` is because the gig
    // database as well is going to be a MongoDB database. So the Gig Database
    // is also a MongoDB Database. If it were to be another type of database,
    // maybe Postgres or MySQL database, then i don't need to set this `ref`.
    // I can set this to whatever the probably the `id` of the row in the
    // database table is. If its a MySQL database, probably i set the `id` here
    // and the `id` will be of type number. But since Gig is going to be a
    // MongoDB database, im setting the `ref` and the ref type is going to be
    // be `mongoose.Schema.Types.ObjectId`
    purchasedGigs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Gig' }],
    createdAt: { type: Date }
    // So those are the properties im going to have for the buyer. And then on
    // the frontend when the user logs in, if the user is a buyer and also a
    // seller, then when the user logs in, im going to fetch the buyer information
    // and the seller information of that particular user i.e of that logged in
    // user.
  },
  {
    // One other thing i want to do here is, im going to set the `versionKey`
    // So normally when mongoose or MongoDB returns the documents, it always
    // add this `__v` data property. I don't want the property to be returned.
    // It just specifies the version.
    versionKey: false
  }
);

// Create the model
// 'Buyer' is going to be the name of the model.
// Second argument to model is the schema.
// Third argument is collection name i.e `Buyer`. So its going to be the same
// as model name for best convention.
// And rest are optional properties.
const BuyerModel: Model<IBuyerDocument> = model<IBuyerDocument>('Buyer', buyerSchema, 'Buyer');

export { BuyerModel };
