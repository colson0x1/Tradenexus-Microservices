/* @ Seller Schema */
import { ISellerDocument } from '@colson0x1/tradenexus-shared';
import { Model, model, Schema } from 'mongoose';

// What I've done here, it might look like as though, schema or a particular
// document will contain a lot of information.
// In MongoDB, a document is allowed to have a maximum size of 16MB. So if i
// have a document that probably the properties and its values will exceed
// 60MB, it will not be allowed in MongoDB except to use the grid. In this case,
// I think this will not be up to 16MB, so its fine.
// In some cases, it maybe with a different design approach, we might want to
// create a separate collection. Maybe we might want to create a collection
// for `experiences`, a collection for `education`, a collection for 'languages'.
// And then when its created, we just reference it right there and then add
// it in a separate collection. So its still possible to do that.
// i.e We might decide to create a collection for `languages`. And then once
// the user creates a language, we add it to the collection and then we refernce
// it here in this file on `languages`. But i decided, for simplicity sake, to
// just add everything in this one schema.
const sellerSchema: Schema = new Schema(
  {
    // This full name will only be displayed to the seller. It will not be
    // displayed to other users.
    // Perhaps i will  decide later on the frontend to display to other users.
    fullName: { type: String, required: true },
    // `username` is what will be displayed on the gig and to other users.
    // Also im indexing `username` for search.
    username: { type: String, required: true, index: true },
    email: { type: String, required: true, index: true },
    // For this profilePicture, because im only going to be using the URL.
    // When i created profilePicture in the Auth service, i created the
    // profile public id. So the URL will always have the profile public id
    // as long as i upload it to cloudinary. But if its from the seed i.e if
    // its from the seed data then its giong to be a little bit different.
    profilePicture: { type: String, required: true },
    // This `description` is going to just be information about the seller.
    // So the seller will add information about themselves.
    // This description is going to be full description!
    description: { type: String, required: true },
    profilePublicId: { type: String, required: true },
    // This description is going to be one liner i.e its just going to be a
    // brief information about themselves.
    // Im setting oneline to default of empty string instead of required true
    // because if required is set to true, when the user creates an account,
    // probably they might not maybe want to add a one liner at first. So i can
    // just leave this as en empty string as default value.
    oneline: { type: String, default: '' },
    country: { type: String, required: true },
    // User can add languages that he/she speaks
    languages: [
      {
        language: { type: String, required: true },
        // `level` is if its beginner leve, if its intermediate level of if its
        // expert level
        // If maybe puts a user that English is not the native language, they
        // can add English and then maybe beginner as the level or maybe if its
        // an Native english speaker, they will add expert as the level.
        level: { type: String, required: true }
      }
    ],
    // The user will add their skills. Its going to be an array of string.
    // So if the seller is a programmer, they can add all the skills that they
    // have. If they're a designer, they can add all the skills they have right
    // here.
    skills: [{ type: String, required: true }],
    // This is going to be the rating count. So for every of the users gig
    // that is rated, im going to just add the total number of ratings for the
    // user gig right here. So default is going to be 0 for all the users gig.
    // So if a buyer rates the user's gig or the user, then im going to add
    // the number. So if its a five star rating, then im going to add 5 because
    // the default is 0.
    ratingsCount: { type: Number, default: 0 },
    // This ratingCategories, im going to add the different level like 5 4 3 2 1.
    // Because im going to use this to display on the seller's profile. Im going
    // to display how many number of five stars they have. How many number of
    // four stars, three, two and one just like that.
    ratingCategories: {
      // So what this means is, how many five star ratings does the user have.
      five: { value: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
      four: { value: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
      three: { value: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
      two: { value: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
      one: { value: { type: Number, default: 0 }, count: { type: Number, default: 0 } }
    },
    // responseTime is going to be in hours but the type is going to be number.
    // So on the user's profile page, im going to add the response time like
    // how long does it take for the user to respond to a message. So two hours,
    // one hour, just like that.
    responseTime: { type: Number, default: 0 },
    // recentDelivery is going to be of type date. This will contain the date of
    // the user's last delivery.
    recentDelivery: { type: Date, default: '' },
    // experience is like their work experience. so work experience of the user.
    // maybe user has worked before.
    experience: [
      {
        company: { type: String, default: '' },
        // So what did the title user hold while working in the company like
        // Senior Engineer, Senior Designer, Mid-level Engineer, Product Manager
        // like that.
        title: { type: String, default: '' },
        // startDate is when the user starts and endDate is when did the user end
        startDate: { type: String, default: '' },
        // For this endDate, the user will implement in such a way that if the user
        // is currently still working there, im going to set a different value
        // there.
        endDate: { type: String, default: '' },
        // description is what was their job description
        description: { type: String, default: '' },
        // currentlyWorkingHere is if the user is currently working at the company
        // then i set this value to true
        currentlyWorkingHere: { type: Boolean, default: false }
      }
    ],
    // Just add their education if they have any. So this is going to be an
    // object array of their education.
    education: [
      {
        country: { type: String, default: '' },
        university: { type: String, default: '' },
        // title is like a degree obtained like BsC, MsC, PhD or something else
        title: { type: String, default: '' },
        // major is what are they graduating i.e couse of study. So was it
        // BSc in Engineering or MSC in engineering, or MBA or in design or
        // whatever.
        major: { type: String, default: '' },
        year: { type: String, default: '' }
      }
    ],
    // On social links, they can specify the links to all the social media accounts.
    socialLinks: [{ type: String, default: '' }],
    // certificates is for example they have something like a cloud certificate
    // like AWS certificate or design certificate like that.
    certificates: [
      {
        // name of the certificate
        name: { type: String },
        // from where it was obtained
        from: { type: String },
        // what year it was obtained
        year: { type: Number }
      }
    ],
    // ongoingJobs is if the user has an ongoing gig that they're working on that
    // they need to deliver. default is 0.
    ongoingJobs: { type: Number, default: 0 },
    // completedJobs is going to be the number of all the jobs that the user
    // completed
    completedJobs: { type: Number, default: 0 },
    // cancelJob is if the user cancels a job i.e cancelled jobs
    cancelledJobs: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    // totalGigs is going to be the total number of gigs the user has.
    totalGigs: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now() }
  },
  // I want to remove the version key
  {
    versionKey: false
  }
);

const SellerModel: Model<ISellerDocument> = model<ISellerDocument>('Seller', sellerSchema, 'Seller');

export { SellerModel };
