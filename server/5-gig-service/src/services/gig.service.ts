// Im only going to GETTING from Elasticsearch. Im not going to GET from
// MongoDB. So im only going to get the data i need from Elasticsearch.

import { ISellerGig } from '@colson0x1/tradenexus-shared';
import { addDataToIndex, getIndexedData } from '@gig/elasticsearch';
import { GigModel } from '@gig/models/gig.schema';
import { publishDirectMessage } from '@gig/queues/gig.producer';
import { gigChannel } from '@gig/server';
import { gigsSearchBySellerId } from '@gig/services/search.service';

// This method will get the data from Elasticsearch
const getGigById = async (gigId: string): Promise<ISellerGig> => {
  const gig: ISellerGig = await getIndexedData('gigs', gigId);
  return gig;
  // or
  // return await getIndexedData('gigs', gigId);
};

// Get seller gigs. For example, this seller i.e `sellerId`  will have
// multiple gigs. So i want to use the `sellerId` to get all the gigs for that
// particular seller.
/* Elastic Dev tools:
 * GET gigs/_search
 * */
// So for that, i really dont have the method i want to use because i will need
// to implement the search feature. So for now, i will just create the function
// without adding anything to it.
// And also for now, i'll set this method to return void so it returns nothing.
// The reason im not adding anything here is because the method i need, Elasticsearch
// does not have a method that i can use to get documents from the `_source`
// So there is no method i can use to just go in and get by `sellerId` or
// get by `username`. I always have to get it by the `_id` because the `_id`
// was what was used to index the documents. But the way im going to implement
// this is, im going to use the search operation. And then, im going to
// search for all documents where the `sellerId` matches whatever id we pass
// in.
// So here is the code for Elasticsearch Dev Tools and here in the `query_string`
// field, im just setting it to only `sellerId` and then for `query` itself,
// im going to use one of the seller's id string among those many documents.
/*
GET gigs/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "query_string": {
            "fields": ["sellerId"],
            "query": "6547ee17bac1c154d4346071"
          }

        }
      ]
    }
  }
}
*/
// So that is how im going to fetch all gigs for a particular seller by the
// sellerId. Im going to search for it. So all documents that matches the
// query id that im passing. That is what im going to use.
// I dont want to add the function that i need here. I will instead create
// a separate Search Service file and then im going to add this function and
// then use it here. So for now i'll just set this as console.log
const getSellerGigs = async (sellerId: string): Promise<ISellerGig[]> => {
  // console.log(sellerId);
  // I created the function in `search.service.ts` to do just that.
  // The document i need is in the `source`. So I need to loop through the
  // `hits` array. And then every `_source` key/property, i add it into this
  // array `[]`
  const resultHits: ISellerGig[] = [];
  // I created this `gigsSearchBySellerId()` in this service though its better
  // to add it into a separate Service which is intended for search like
  // Search Service
  // Here im setting it to true because i want to return all the active gigs
  // from a particular seller.
  // This `gigs` returns an object with `total` which is a number and then,
  // `hits` array. But what i need isnt the actual object, i need a property
  // `_source` that is inside this `hits` array. So i need to loop through
  // this `hits` array.
  // Here, i search for all documents that matches the sellerId and return
  // only the active ones!
  const gigs = await gigsSearchBySellerId(sellerId, true);
  for (const item of gigs.hits) {
    resultHits.push(item._source as ISellerGig);
  }
  return resultHits;
};

// Inactive gigs / Paused gigs
// Search for all documents that matches the sellerId and return only the
// inactive ones!
const getSellerPausedGigs = async (sellerId: string): Promise<ISellerGig[]> => {
  const resultHits: ISellerGig[] = [];
  const gigs = await gigsSearchBySellerId(sellerId, false);
  for (const item of gigs.hits) {
    resultHits.push(item._source as ISellerGig);
  }
  return resultHits;
};

/* @ Gig Service CREATE method */
// I want to use this `addDataToIndex()` method thats defined on `src/elasticsearch.ts`
// I've decided to implement in a way to first save it to MongoDB. We can also
// decide that we want to remove MongoDB altogether like we dont want to use
// mongoDB at all. If we decide to use that approach, then we'll have to generate
// our `id` because this `_id` from elasticsearch is the id created by MongoDB.
// That is what im using to index the document. So if we want to implement it
// separately i.e i only will want to use Elasticsearch without MongoDB, then
// we have to generate our own IDs. But for me, here, im saving it to MongoDB so
// that i'll be able to use MongoDB. That is how i just decided to implement it.
// Here, im going to return the normal gig object and then param that im passing
// in is `gig` of type `ISellerGig` so im passing the complete `gig` object.
const createGig = async (gig: ISellerGig): Promise<ISellerGig> => {
  // Create the gig
  // This `create` method, once it creates the object or the document in
  // MongoDB, it will return new created document. So that is why im using
  // `create` here.
  const createdGig: ISellerGig = await GigModel.create(gig);
  // As in the gig model i.e `gig.schema.ts`, i want to be able to use that
  // transform. Because MongoDB create the `_id` and i dont need the `_id`
  // property. So if i check this `createdGig` above, its going to have the
  // `_id`. I dont need that because Elasticsearch will thrown an error.
  // `_id` is a reserved keyword used by Elasticsearch. So what im going to do
  // is, right here, im going to call `toJSON`. `toJSON()` is available inside
  // this `createdGig` property.
  // So this `toJSON` object will be added as a property into the every object
  // once they are returned. So we have access to this `toJSON`
  if (createdGig) {
    // So im calling `toJSON` as a method. So what this means is,
    // MongoDB has two types of documents. It has mongodb documents or rather
    // mongoose documents because im using mongoose. So if i return `_doc`,
    // then im going to have the mongoose document. And the mongoose document
    // has some properties, a lot of properties that i dont need.
    // And then, there's other type `rec`, which is a pure JavaScript JSON
    // object. So first `_doc` is a mongoose object with different mongoose
    // properties and our own properties. And then second one is the record (`rec`),
    // that contains the pure JavaScript object notation which is the pure JSON
    // object. And that is why im returning it in `toJSON` inside `gig.schema.ts`.
    // So, once i call this `toJSON`, it'll return the pure JavaScript JSON
    // object. But if we returned this `_doc`, then we are not getting the JSON
    // object. We are getting the mongoose object instead.  But i dont need the
    // mongoose object, i only need the JSON object. So that is why im returning
    // this `rec` i.e record, right there.
    // And here below, once i call this `toJSON` as a method, it'll return the
    // `ISellerGig` object and not the mongoose object. So here now, inside
    // this object i.e `data` im going to have virtual `id` property. I'll have
    // this `id` and that `_id` one will already be deleted. So this `_id` is
    // going to be deleted while im going to have this `id` property.
    const data: ISellerGig = createdGig.toJSON?.() as ISellerGig;
    // Here, i publish the message.
    // Name of the exchange is in Users Service
    // `users/src/queues/user.consumer.ts`
    // So im going to send a message with a type `update-gig-count` with
    // exchange and routing key to a particular queue and it will be consumed
    // in the `user.consumer.ts` from the Users Service.
    await publishDirectMessage(
      gigChannel,
      // exchange, routing key and type is on `user.consumer.ts` from Users Service.
      // exchange name
      'tradenexus-seller-update',
      // routing key
      'user-seller',
      // Stringified JSON message
      // What i want to do with this method is just to update the sellers gig
      // count i.e `updateTotalGigsCount` as in `user.consumer.ts`. So if the
      // seller creates a gig, i want to update this property `totalGigs` defined
      // in `users/src/models/seller.schema.ts`.
      // So if the seller creates the first gig, i increment that defauly value
      // 0 by 1. If the user creates another gig, i increment it by 1 as well.
      // So that is what i want to do with this direct message right here.
      // So `type` is going to be `update-gig-count` as i pass the gig seller id
      // and then also the count. count is going to be 1.
      // gigSellerId is going to be id from `data.sellerId`
      // `user.consumer.ts`
      // So this is what im sending in the message
      JSON.stringify({ type: 'update-gig-count', gigSellerId: `${data.sellerId}`, count: 1 }),
      'Details sent to users service.'
    );
    // And then, i'll add the message to the Elasticsearch.
    // `gigs` is the index, item id is the `_id` property thats retrieved
    // right from Elasticsearch dev tools: GET gigs/_search
    // that is what i want to add here so `createdGig._id` or `data.id`
    // Both `createdGig._id` or `data.id` works. But i'll use `createdGig._id`
    // and then last argument, i pass in the `data`.
    await addDataToIndex('gigs', `${createdGig._id}`, data);
  }
  // So in nutshell, this function `createdGig`, i first create the gig i.e
  // `createdGig`. And if the gig is returned, i convert the gig from the
  // mongoose object to normal JSON object with this `toJSON` method. And then,
  // i publish the message to the Users Service and then i add the data to
  // Elasticsearch. So this is the method im going to use to add a new sellers
  // gig to the index.
  return createdGig;
};

export { getGigById, getSellerGigs, getSellerPausedGigs, createGig };
