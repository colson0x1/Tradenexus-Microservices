// If i check `gig.service.ts`, there's method to `getGigById`, `getSellerGigs`,
// and then `getSellerPausedGigs. So im going to add the controller
// methods for those three functions

import { ISellerGig } from '@colson0x1/tradenexus-shared';
import { getGigById, getSellerGigs, getSellerPausedGigs } from '@gig/services/gig.service';
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

export { gigById, sellerGigs, sellerInactiveGigs };
