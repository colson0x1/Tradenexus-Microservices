/* This is the controller method that will be used to add the gig to Elasticsearch
and also to MongoDB */

import { BadRequestError, ISellerGig, uploads } from '@colson0x1/tradenexus-shared';
import { gigCreateSchema } from '@gig/schemes/gig';
import { createGig } from '@gig/services/gig.service';
import { UploadApiResponse } from 'cloudinary';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

// This is the fn i need to be able to create a gig or a seller to create a gig.
// I first validate then after validation if its successful, i upload. If the
// upload is successful, then i create the gig and then send this response
// back to the API gateway.
const gig = async (req: Request, res: Response): Promise<void> => {
  // validate is synchrous method and validateAsync is asynchronous
  // Because its synchronous, im passing this `req.body` inside this `Promise.resolve`
  // so that its going to return it as Promise. If i use async, its going to be
  // different.
  const { error } = await Promise.resolve(gigCreateSchema.validate(req.body));
  // If there's an error, then this `details` property will be inside this
  // `error` object. So if i have this `details` property inside the `error`
  // object, that means there is an error. So i throw new bad request error.
  if (error?.details) {
    throw new BadRequestError(error.details[0].message, 'Create gig() method');
  }
  // If no error, i need to upload the cover image. Im going to send this
  // `coverImage` of the gig that is on `gig/src/schemes/gig.ts`
  // But for the cover image, im not going to use a publicId for it. Im going
  // to allow Cloudinary to create a public id because we want to be able to
  // change the cover image.
  const result: UploadApiResponse = (await uploads(req.body.coverImage)) as UploadApiResponse;
  // Now if this UploadApiResponse is successful, i can check the content.
  // So what i want to do is, if it is successful, the UploadApiResponse will
  // contain this `public_id`. So if this result contains a public id then it
  // is successful but if it does not contain a public id that means its an
  // error.
  if (!result.public_id) {
    // So if this `result` object does not contain a public id, then it returned
    // an error
    throw new BadRequestError('File upload error. Try again.', 'Create gig() method');
  }
  // But if it returned an actual response, then i need to create my seller gig.
  const gig: ISellerGig = {
    // every property here, im getting them from `req.body` except the `coverImage`
    // So for the `coverImage` im setting `result.sercureUrl`
    sellerId: req.body.sellerId,
    username: req.currentUser!.username,
    email: req.currentUser!.email,
    profilePicture: req.body.profilePicture,
    title: req.body.title,
    description: req.body.description,
    categories: req.body.categories,
    subCategories: req.body.subCategories,
    tags: req.body.tags,
    price: req.body.price,
    expectedDelivery: req.body.expectedDelivery,
    basicTitle: req.body.basicTitle,
    basicDescription: req.body.basicDescription,
    coverImage: `${result?.secure_url}`
  };
  // `createdGig` will return `ISellerGig`
  // `createGig` method adds gig to MongoDB, publishes an event and then adds
  // to Elasticsearch and then returns the created gig.
  const createdGig: ISellerGig = await createGig(gig);
  // Send this `createdGig` response back to the API Gateway
  res.status(StatusCodes.CREATED).json({ message: 'Gig created successfully.', gig: createdGig });
};

export { gig };
