/* @ Buyer's Service */
// This contains first three methods to GET a buyer and then last three methods
// to UPDATE the buyer.

import { IBuyerDocument } from '@colson0x1/tradenexus-shared';
import { BuyerModel } from '@users/models/buyer.schema';

// Method to get the buyer by email
// So im going to pass the `email` into this method and its going to return:
// If its finds the buyer document, its going to return the buyer document which
// is of type `IBuyerDocument`. Otherwise its going to return `null`.
const getBuyerByEmail = async (email: string): Promise<IBuyerDocument | null> => {
  // Find the document where the email matches whatever email the user sends
  // I've already indexed the email in the buyer's model. And now it can be
  // used for searching buyer by email.
  // So i was very sure that later, i was going to search buyer by email and
  // that is why i indexed email on the buyers model.
  // profilePicture, country, isSeller, purchasedGigs are not indexed because
  // im not going to search for a buyer document by any of those properties.
  // im going to search a buyer document only by a username or the email.
  const buyer: IBuyerDocument | null = (await BuyerModel.findOne({ email }).exec()) as IBuyerDocument;
  return buyer;
};

// Method to get the buyer by username
// username is also indexed
const getBuyerByUsername = async (username: string): Promise<IBuyerDocument | null> => {
  const buyer: IBuyerDocument | null = (await BuyerModel.findOne({ username }).exec()) as IBuyerDocument;
  return buyer;
};

// This method will be used only after i create a function to create seed
// data for seller.
// So im going to use this function to get random buyers.
// `count` is how many buyer that we want
// And here im retuning an array i.e IBuyerDocument array. im not returning null.
const getRandomBuyers = async (count: number): Promise<IBuyerDocument[]> => {
  // To get the users or the random users, im going to use the MongoDB's
  // `aggregate()` method. And inside that method, im going to pass array and
  // then an object. Inside the object, im going to use the `$sample` operator.
  // And the `sample` operator value is an object. The object takes a size and
  // the size value is the count.
  // So, this `$sample` operator is used to return random items from the
  // collection. And then the `sample` operator, it takes the size and the
  // size value is going to be whatever we are specifying.
  // So if we want to get random documents from our MongoDB collection, we can
  // do something like this. And then its going to return an array because
  // aggregate always returns an array.
  const buyers: IBuyerDocument[] = await BuyerModel.aggregate([{ $sample: { size: count } }]);
  return buyers;
};

/* @ Three methods to CREATE a Buyer */
// When we send, when the user creates an account, im going to publish a
// message to the Users service and then we consume the message and then use
// it to create a buyer.
// These are the method that will be used to create the buyer!

const createBuyer = async (buyerData: IBuyerDocument): Promise<void> => {
  // At first check, if the buyer exists
  // If it does not exist, it returns null
  // The method that im going to use here is `getBuyerByEmail()`
  // i.e if buyer exists, return `IBuyerDocument` otherwise return `null`.
  const checkIfBuyerExist: IBuyerDocument | null = await getBuyerByEmail(`${buyerData.email}`);
  // If the buyer does not already exist so if there is no buyer in the collection,
  // then create buyer in the database
  if (!checkIfBuyerExist) {
    await BuyerModel.create(buyerData);
  }
};

/* @ Functions to update `isSeller` and `purchasedGigs` */
// Im creating method that will be used to update `isSeller` defined on the
// buyer schema. By default, its going to be false. Then when a buyer creates
// a seller's account, then i need to update this property to true. So the
// buyer is actually a seller.
// Also, im going to create another method to update `purchasedGigs` array. So
// the method will use it to add or remove gigs.

// Function to update this `isSeller`
// This function will not return anything so Promise of type void. So i just
// want to update.
const updateBuyerIsSellerProp = async (email: string): Promise<void> => {
  // updating just one document
  await BuyerModel.updateOne(
    // which document do i want to update is any document where email matches
    // whatever email the user is sending right there in the params.
    { email },
    // and what i want to update is seller using `$set` property
    // So if a buyer becomes a seller, i update this property and set it to
    // true
    {
      $set: {
        isSeller: true
      }
    }
  ).exec();
};

// Function to update this `purchasedGigs`
// So if a buyer purchases a gig from a seller and then the seller delivers,
// then im going to add the `id` of that gig into this `purchasedGigs` array.
// But if the buyer purchased the gig and then after a period of time, the
// seller or maybe the buyer asks the seller to cancel the order. So if the
// seller cancels the order, then that gig, im going to need to remove it.
// If its already added to this `purchasedGigs` array, then i need to remove
// it from that array.
// Here im going to have three params:
// buyerId of type string.
// purchasedGigId is of type string. This is just going to be the `_id` of the
// gig that the buyer purchased.
// type will be used to either add or remove.
const updateBuyerPurchasedGigsProp = async (buyerId: string, purchasedGigId: string, type: string): Promise<void> => {
  // updating just one document
  await BuyerModel.updateOne(
    // which document do i want to update is any document where the `_id` matches
    // the `buyerId`
    { _id: buyerId },
    type === 'purchased-gigs'
      ? {
          // if type is purchased-gigs, then i want to push into that array
          // so here im using `$push` operator and i want to push gigs into this
          // purchasedGigs array
          $push: {
            purchasedGigs: purchasedGigId
          }
        }
      : {
          $pull: {
            // so else if its anything except purchased-gigs, i remove. so i
            // pull out of the array
            purchasedGigs: purchasedGigId
          }
        }
  ).exec();
};

export { getBuyerByEmail, getBuyerByUsername, getRandomBuyers, createBuyer, updateBuyerIsSellerProp, updateBuyerPurchasedGigsProp };
