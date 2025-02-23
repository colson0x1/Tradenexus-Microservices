// If i check `gig.service.ts`, there's method to `getGigById`, `getSellerGigs`,
// and then `getSellerPausedGigs. So im going to add the controller
// methods for those three functions

import { ISearchResult, ISellerGig } from '@colson0x1/tradenexus-shared';
import { getUserSelectedGigCategory } from '@gig/redis/gig.cache';
import { getGigById, getSellerGigs, getSellerPausedGigs } from '@gig/services/gig.service';
import { getMoreGigsLikeThis, getTopRatedGigsByCategory, gigsSearchByCategory } from '@gig/services/search.service';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

// @ Method to get a single gig
const gigById = async (req: Request, res: Response): Promise<void> => {
  const gig: ISellerGig = await getGigById(req.params.gigId);
  res.status(StatusCodes.OK).json({ message: 'Get gig by id', gig });
};

// @ Method to get all gigs from a particular seller
const sellerGigs = async (req: Request, res: Response): Promise<void> => {
  const gigs: ISellerGig[] = await getSellerGigs(req.params.sellerId);
  res.status(StatusCodes.OK).json({ message: 'Seller gigs', gigs });
};

// @ Method to get inactive gigs from a particular seller
const sellerInactiveGigs = async (req: Request, res: Response): Promise<void> => {
  const gigs: ISellerGig[] = await getSellerPausedGigs(req.params.sellerId);
  res.status(StatusCodes.OK).json({ message: 'Seller gigs', gigs });
};

// @ Method to get top rated gigs by category
// I have a fn called `getUserSelectedGigCategory`, so im going to use this
// to get the category from Redis cache. So i use this method to get the category
// first and then use whatever the result is to get the actual data.
const topRatedGigsByCategory = async (req: Request, res: Response): Promise<void> => {
  // So im going to have a top level value called `selectedCategories` like a
  // top level object. And inside this object, that is where im going to add
  // all the `username` of every user that has a category in the Redis cache.
  // i.e im getting the category value from Redis cache so this `category`
  // will return a string
  const category = await getUserSelectedGigCategory(`selectedCategories:${req.params.username}`);
  const resultHits: ISellerGig[] = [];
  // Here i get top category
  const gigs: ISearchResult = await getTopRatedGigsByCategory(`${category}`);
  // Here i loop through `hits` and push the `_source` into the list
  for (const item of gigs.hits) {
    resultHits.push(item._source as ISellerGig);
  }
  // Return the result
  res.status(StatusCodes.OK).json({ message: 'Search top gigs results', total: gigs.total, gigs: resultHits });
};

// The difference between the `topRatedGigsByCategory` and `gigsByCategory` is
// that the `topRatedGigsByCategory` will only return gigs for a specific
// category that have a 5 star ratings. While this `gigsByCategory` will just
// return the gigs based on the total number i specified like 10 which i specified.
const gigsByCategory = async (req: Request, res: Response): Promise<void> => {
  const category = await getUserSelectedGigCategory(`selectedCategories:${req.params.username}`);
  const resultHits: ISellerGig[] = [];
  const gigs: ISearchResult = await gigsSearchByCategory(`${category}`);
  for (const item of gigs.hits) {
    resultHits.push(item._source as ISellerGig);
  }
  res.status(StatusCodes.OK).json({ message: 'Search gigs category results', total: gigs.total, gigs: resultHits });
};

const moreLikeThis = async (req: Request, res: Response): Promise<void> => {
  const resultHits: ISellerGig[] = [];
  const gigs: ISearchResult = await getMoreGigsLikeThis(req.params.gigId);
  for (const item of gigs.hits) {
    resultHits.push(item._source as ISellerGig);
  }
  res.status(StatusCodes.OK).json({ message: 'More gigs like this result', total: gigs.total, gigs: resultHits });
};

export { gigById, sellerGigs, sellerInactiveGigs, topRatedGigsByCategory, gigsByCategory, moreLikeThis };
