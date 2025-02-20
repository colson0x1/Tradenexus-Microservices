// The idea im going to follow is simple. Once a user creates a gig, im going
// to save to MongoDB. Im just adding it to MongoDB. We can fetch from MongoDB
// as well.
// In the normal case, since i want to use Elasticsearch, i can only add or
// retrieve from Elasticsearch. But i decided to add MongoDB to this. So im
// going to add MongoDB and then once i get the returned data, then i'll add it
// to Elasticsearch.
// i.e For me personally, I dont really see a big benifit to using both MongoDB
// and also Elasticsearch to store the gigs. So I just added it in case, maybe
// i want to use MongoDB to perform some other operations.

import { ISellerGig } from '@colson0x1/tradenexus-shared';
import mongoose, { model, Model, Schema } from 'mongoose';

// Define properties that i need in the Schema
// These are the information from the Seller
// For the properties that i need, here in Elasticsearch Dev tool:
/*
GET gigs/_search
*/
// So for every gig document, those are the properties that im going to create!
const gigSchema: Schema = new Schema(
  {
    // Type of this `sellerId` is giong to be mongoose object id
    // This `sellerId` is important because im going to use it to fetch all the
    // gigs related to a particular seller.
    sellerId: { type: mongoose.Schema.Types.ObjectId, index: true },
    /* sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', index: true }, */
    // Here im using the `username` of the seller because the `username` will
    // not be updated. So once they create the username and that is it. They
    // are not going to update the username.
    // Had it been, if i was going to implement the feature whereby i update
    // the username, the email. Then i dont need to add the `username` here.
    // I will just use this `sellerId` as a reference and then I'll populate.
    // When making a request, just populate this information i.e `sellerId`
    // But because im not going to be updating email or username once they have
    // been created, then its fine. I can set the `username` here as well.
    username: { type: String, required: true },
    profilePicture: { type: String, required: true },
    email: { type: String, required: true },
    // Long Title of the Gig
    title: { type: String, required: true },
    // Long Description of the gig
    description: { type: String, required: true },
    // Short title of the gig
    basicTitle: { type: String, required: true },
    // Short description of the gig
    basicDescription: { type: String, required: true },
    // Gig will just have one main category i.e we belong to one category but we
    // can have multiple sub categories
    categories: { type: String, required: true },
    subCategories: [{ type: String, required: true }],
    tag: [{ type: String }],
    // So when the gig is created, the default value of this `active` property
    // is going to be true
    active: { type: Boolean, default: true },
    expectedDelivery: { type: String, default: '' },
    // ratingCount and other same like Seller Schema
    ratingsCount: { type: Number, default: 0 },
    ratingSum: { type: Number, default: 0 },
    ratingCategories: {
      five: { value: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
      four: { value: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
      three: { value: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
      two: { value: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
      one: { value: { type: Number, default: 0 }, count: { type: Number, default: 0 } }
    },
    price: { type: Number, default: 0 },
    sortId: { type: Number },
    // For cover image, im only going to allow just one image to be uploaded.
    // So maybe later, i can add, allow the user to upload multiple images feature
    // instead and for that, i just need to convert this into an array.
    coverImage: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  {
    versionKey: false,
    // `toJSON` is a method from mongoose and inside the toJSON key, i'll add
    // the transform method. So what i want to transform here is, i want to be
    // able to delete the `_id`. But before i delete the `_id`, i want to create
    // a or set the value of the `_id` property to the new `id` property, which
    // is the property that i want to use.
    toJSON: {
      // Here this will take the `_doc` and `ret` and then im going to make
      // changes.
      // `_doc` is the mongoose document and `ret` is like record, the object.
      // `ret` or `rec` i.e record, so the record contains the actual objects
      // without any mongoose parameter while this `_doc` contains the actual
      // mongoose object. Mongoose object will contain some other mongoose
      // properties. so `_doc` contains the mongoose object with its properties.
      // while this `rec` is just a regular record, which is just a regular
      // object.
      // So this `id` that im creating right down below using virtual, im
      // setting it to whatever we have i.e setting it to `rec._id` and then
      // i delete the `rec._id`.
      // So if im fetching a new id from the mongoose database, it is not going
      // to return this `_id`, it'll only return the `id` property. Because
      // i want to save it to Elasticsearch without the `_id` cause `_id` in
      // Elasticsearch is a reserved keyword just like how our document in
      // Elasticsearch can't contain `_index`, `_score`, `_source` because all
      // of these are reserved keywords.
      transform(_doc, rec) {
        // I've not added this `id`. im going to `id` using virtual.
        rec.id = rec._id;
        delete rec._id;
        return rec;
      }
    }
  }
);

// I want to create a virtual property and the virtual property is going to
// be called `id`.
gigSchema.virtual('id').get(function () {
  // So for this virtual `id`, im going to set the value to whatever this
  // `_id` is.
  return this._id;
});

// Create the actual gig model
// First argument is the Model name so the model name will be 'Gig'
// Second argument is the schema and Third argument is the collection name
// explicitly. Normally this isnt required, unless we want to specify a
// collection name that differs from the pluralized form of the model name.
const GigModel: Model<ISellerGig> = model<ISellerGig>('Gig', gigSchema, 'Gig');

export { GigModel };

// In Elasticsearch documents, the `_id` is a keyword. So if we try to add a
// document with this property `_id`, Elasticsearch will throw an error. And
// whenever we create a new MongoDB document, it creates this `_id` property.
// And, the way i want to implement it is such that once i save to MongoDB,
// im going to get the created document. And then im going to add the document
// to Elasticsearch.
/* Save to MongoDB -> Get the created doc -> Add the doc to Elasticsearch */
// So that's the pattern im going to follow i.e once i save to MongoDB, then
// i get the created document and then i add it to Elasticsearch.
// But in this process of creating, once it is saved to MongoDB, MongoDB will
// create this `_id` property. And i can't use this `_id` i.e I can't send
// `_id` to Elasticsearch because it is a keyword. So if we try, its going to
// throw an error. So i need to convert the `_id` created by MongoDB into into
// just the regular `id`. If we're using different process, probably we dont
// want to save to MongoDb, we just want to save directly to Elasticsearch,
// then we can autogenerate our own id and just name it `id`. So its going
// to be the id that will be used to index that particular document.
// And to transform a property, i'll use `toJSON()` from mongoose.
