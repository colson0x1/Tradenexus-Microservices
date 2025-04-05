import { IReviewDocument } from '@colson0x1/tradenexus-shared';
import { addReview } from '@review/services/review.service';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export const review = async (req: Request, res: Response): Promise<void> => {
  // Object that i want to send
  /* const reviewDocument: IReviewDocument = {
    gigId: req.body.gigId,
    reviewerId: req.body.reviewerId,
    reviewerImage: req.body.reviewerImage,
    sellerId: req.body.sellerId,
    review: req.body.review,
    rating: req.body.rating,
    orderId: req.body.orderId,
    createdAt: req.body.createdAt,
    reviewType: req.body.type,
    reviewerUsername: req.body.reviewerUsername,
    country: req.body.country
  }; */
  // I dont need that ^ object right here because im going to contruct the same
  // object on my client. Im going to send it so i can just pass req.body.
  // req.body will be of type IReviewDocument.
  // So here i add whatever im in the `req.body`. So i hadd whatever im sending
  // to the `addReview`.
  const review: IReviewDocument = await addReview(req.body);
  // And then i send the message and the review object with status code of 201.
  res.status(StatusCodes.CREATED).json({ message: 'Review created successfully.', review });
};
