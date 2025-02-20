// Im only going to GETTING from Elasticsearch. Im not going to GET from
// MongoDB. So im only going to get the data i need from Elasticsearch.

import { ISellerGig } from '@colson0x1/tradenexus-shared';
import { getIndexedData } from '@gig/elasticsearch';
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

export { getGigById, getSellerGigs, getSellerPausedGigs };
