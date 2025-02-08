/* @ This file will also have method to GET and method to CREATE */

import { IOrderMessage, IRatingTypes, IReviewMessageDetails, ISellerDocument } from '@colson0x1/tradenexus-shared';
import { SellerModel } from '@users/models/seller.schema';
import mongoose from 'mongoose';
import { updateBuyerIsSellerProp } from '@users/services/buyer.service';

// In the end, i might perhaps dont want to add sellers to MongoDB and instead,
// I might add them to Elasticsearch so as to enable me to implement some
// search features that maybe a search feature specific for sellers.
// But as of right now, since im adding sellers to MongoDB, im going to get
// them from MongoDB as well.

/* @ GET seller methods */

const getSellerById = async (sellerId: string): Promise<ISellerDocument | null> => {
  // Get the seller
  // Find document where `_id` matches `sellerId`.
  // We need to cast `sellerId` to a new MongoDB ObjectId type for it to work.
  // Sometimes in some cases its going to work if the `_id` is a string but for
  // this case, we need to cast it to new mongose object id.
  // NOTE: this `_id` property, i did not specify in model i.e seller.schema.ts,
  // because MongoDB automatically creates that `_id` and then it is indexed
  // automatically!
  const seller: ISellerDocument | null = (await SellerModel.findOne({
    _id: new mongoose.Types.ObjectId(sellerId)
  }).exec()) as ISellerDocument;
  return seller;
};

const getSellerByUsername = async (username: string): Promise<ISellerDocument | null> => {
  // Get the seller
  // Find document where `_id` matches `username`.
  // Here we don't need to case so im just passing in `username`
  const seller: ISellerDocument | null = (await SellerModel.findOne({ _id: username }).exec()) as ISellerDocument;
  return seller;
};

const getSellerByEmail = async (email: string): Promise<ISellerDocument | null> => {
  // Get the seller
  // Find document where `_id` matches `email`.
  const seller: ISellerDocument | null = (await SellerModel.findOne({ _id: email }).exec()) as ISellerDocument;
  return seller;
};

// Get random sellers
// size is the number of random sellers that we want to get
const getRandomSellers = async (size: number): Promise<ISellerDocument[]> => {
  const sellers: ISellerDocument[] = await SellerModel.aggregate([{ $sample: { size } }]);
  return sellers;
};

/* @ CREATE seller methods */

// Once we update, we want to return the seller documents so the return type
// is promise of type ISellerDocument.
const createSeller = async (sellerData: ISellerDocument): Promise<ISellerDocument> => {
  // Also note: Whenever we create a seller, we also need to update the `isSeller`
  // property. So im going to use `updateBuyerIsSellerProp` fn here as well.
  const createdSeller: ISellerDocument = (await SellerModel.create(sellerData)) as ISellerDocument;
  // Then once seller is created, the next thing i want to do is call this
  // `updateBuyerIsSellerProp` method and pass in the `email`.
  await updateBuyerIsSellerProp(`${createdSeller.email}`);
  // Now its easier for me to use this `updateBuyerIsSellerProp` while creating
  // the new seller because the buyer and the seller, they are in the same
  // service. If the buyer was a separate service then i'll have to publish a
  // RabbitMQ event or a message. So here on this: await updateBuyerIsSellerProp...
  // step, i have to publish a RabbitMQ event and then on the buyer service,
  // if its a separate service, we consume the message and then update the
  // appropriate data.
  return createdSeller;
};

/* @ UPDATE seller methods */

// Update seller's document
// And once i update, im going to return the updated document which is going
// to be a Promise of type ISellerDocument
const updateSeller = async (sellerId: string, sellerData: ISellerDocument): Promise<ISellerDocument> => {
  // Now in order for me to be able to update and then return, im going to use the
  // `findOneAndUpdate()` method.
  // So if we use the update method to update, then if we want to get the
  // updated document, we have to call or use the findOne to get that document.
  // But if we want to return the updated document, if we're using mongoose,
  // we can call the `findOneAndUpdate`
  const updatedSeller: ISellerDocument = (await SellerModel.findOneAndUpdate(
    // what do i want to look for is any document where the `_id` matches
    // `sellerId`
    { _id: sellerId },
    // what do i want to update is are these properties
    // So here once i update these properties by calling the `$set` operator,
    // i set this `new` to true so that i get the updated and not the previous
    // document and then i return it;
    {
      $set: {
        profilePublicId: sellerData.profilePublicId,
        fullName: sellerData.fullName,
        profilePicture: sellerData.profilePicture,
        description: sellerData.description,
        country: sellerData.country,
        skills: sellerData.skills,
        oneliner: sellerData.oneliner,
        languages: sellerData.languages,
        responseTime: sellerData.responseTime,
        experience: sellerData.experience,
        education: sellerData.education,
        socialLinks: sellerData.socialLinks,
        certificates: sellerData.certificates
      }
    },
    // Setting `new` to true means, once it returns the updated document, if
    // we don't set this `new` property to be true, it'll return the previous
    // document even though the document has been updated. so to return the
    // updated document, im setting this object here with `new` set to `true`.
    { new: true }
  ).exec()) as ISellerDocument;
  // return the updated seller
  return updatedSeller;
};

// Here i dont want to return any document or any value so i set this to
// Promise<void>
const updateTotalGigsCount = async (sellerId: string, count: number): Promise<void> => {
  // what i want to update is a document where the `_id` matches `sellerId`
  // if we want to update the a number, we use the `$inc` operator. So what i
  // want to increment is totalGigs and i want to increment totalGigs by count.
  // So whatever the `count` value is, if the count value is 10 then we increment
  // `totalGigs` property by 10 like that.
  await SellerModel.updateOne({ _id: sellerId }, { $inc: { totalGigs: count } }).exec();
};

// increment `ongoingJobs` property
const updateSellerOngoingJobsProp = async (sellerId: string, ongoingJobs: number): Promise<void> => {
  await SellerModel.updateOne({ _id: sellerId }, { $inc: { ongoingJobs } }).exec();
};

// So when a seller completes a job, increment
// So this is going to come from the Order service. So once the order is
// completed, im going to send this `data` object.
const updateSellerCompletedJobsProp = async (data: IOrderMessage): Promise<void> => {
  // Get the properties that i need from data
  // So these are the properties that i want to update in the seller schema
  const { sellerId, ongoingJobs, completedJobs, totalEarnings, recentDelivery } = data;

  await SellerModel.updateOne(
    { _id: sellerId },
    {
      $inc: {
        ongoingJobs,
        completedJobs,
        totalEarnings
        // since `recentDelivery` is not a number. so instead of using
        // `$inc` operator, im going to use `$set` operator.
      },
      $set: { recentDelivery: new Date(recentDelivery!) }
    }
  ).exec();
};

// Method to update the `ratingsCount`, `ratingSum` and `ratingCategories`
// properties
// This will be related to reviews i.e ratings and reviews
const updateSellerReview = async (data: IReviewMessageDetails): Promise<void> => {
  // So for this `ratingCategories`, i need to update the properties like
  // `five`, `four`, `three` like that. So if this rating is a five star
  // rating, i update this property `five`. If its a 4 star rating, i update
  // `four` property like that.
  // Here, im using this `ratingTypes` to get the particular value from the
  // object.
  const ratingTypes: IRatingTypes = {
    '1': 'one',
    '2': 'two',
    '3': 'three',
    '4': 'four',
    '5': 'five'
  };
  // Lets say, if its a 3 star rating, im going to use the rating value (i.e data.rating)
  // to get the value from the above `ratingTypes`. The rating types as
  // specified on `ratingCategories` in seller.schema.ts are: five, four, three,
  // two and one. And that is what i specified as the values in the above
  // `ratingTypes`. But the key above is going to be the actual rating. So if
  // its a 5 star rating, im going to check this `ratingTypes` and then use
  // that 5 star rating value to get the value right there on `ratingTypes`
  // that i need to specify in this i.e `ratingCategories` ratings.
  // So that is what the `ratingKey` does here.
  const ratingKey: string = ratingTypes[`${data.rating}`];
  await SellerModel.updateOne(
    // what document i want to update is any document where `_id` matches
    // `data.sellerId`
    { _id: data.sellerId },
    // what im going to update
    {
      // im going to use `$inc` operator because the values are numbers
      // in `ratingCategories`. So i want to increment them
      $inc: {
        // ratingCount is going to always increment the number by 1 i.e the
        // total number of ratings that the user has received is the ratingsCount
        ratingsCount: 1,
        // so whatever this data.rating value is, i want to add it to this
        // ratingSum.
        // So difference between `ratingsCount` and `ratingSum` is `ratingsCount`
        // is the total number of ratings that the user has received. So if the
        // user has received two 5 star ratings and then one 4 star ratings,
        // one 3 start ratings. So the toal the user has received is 4 ratings count.
        // But `ratingSum` is going to be the sum of the 5 star, which is 10
        // + the four star rating which is now 14 + the three star rating which is
        // now 17. That is what im going to add here
        ratingSum: data.rating,
        // dynamically updating the properties here
        // so this is how we dynamically update like a key in an object or a
        // property inside an object
        // So whatever this `ratingKey` is going to return. Lets say if the
        // ratingKey returned 5, we get the `five` key out of the `ratingCategories`
        // and then we update increment the value by `data.rating`
        [`ratingCategories.${ratingKey}.value`]: data.rating,
        // Here i do the same thing with the count. For the count, its going to
        // be 1 instead
        [`ratingCategories.${ratingKey}.count`]: 1
        // So if its a five star rating, once we update teh value inside
        // `ratingCategories`, so once we add the value to 5 for object `five`,
        // then we increment the `count` property of the `five` object by 1.
        // And if its a two star rating, we add the value and the we increment
        // the count by 1 and like that.
      }
    }
  ).exec();
};

export {
  getSellerById,
  getSellerByUsername,
  getSellerByEmail,
  getRandomSellers,
  createSeller,
  updateSeller,
  updateTotalGigsCount,
  updateSellerOngoingJobsProp,
  updateSellerCompletedJobsProp,
  updateSellerReview
};
