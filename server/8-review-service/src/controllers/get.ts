import { IReviewDocument } from '@colson0x1/tradenexus-shared';
import { getReviewsByGigId, getReviewsBySellerId } from '@review/services/review.service';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export const reviewsByGigId = async (req: Request, res: Response): Promise<void> => {
  // The reason why im not having any issues here is because i actually know
  // what the request params will be like req.params.gigId, req.params.username.
  // In some applications, engineers will set interfaces or types for
  // req.body and and then req.params. So if those properties doesn't exist,
  // then it will show an error.
  // But since i know, its fine this way.
  const reviews: IReviewDocument[] = await getReviewsByGigId(req.params.gigId);
  res.status(StatusCodes.OK).json({ message: 'Gig reviews by gig id', reviews });
};

export const reviewsBySellerId = async (req: Request, res: Response): Promise<void> => {
  const reviews: IReviewDocument[] = await getReviewsBySellerId(req.params.sellerId);
  res.status(StatusCodes.OK).json({ message: 'Gig reviews by seller id', reviews });
};
