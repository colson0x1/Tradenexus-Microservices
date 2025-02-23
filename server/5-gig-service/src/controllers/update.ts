import { BadRequestError, isDataURL, ISellerGig, uploads } from '@colson0x1/tradenexus-shared';
import { gigUpdateSchema } from '@gig/schemes/gig';
import { updateActiveGigProp, updateGig } from '@gig/services/gig.service';
import { UploadApiResponse } from 'cloudinary';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

// @ `gigUpdate` method
// I need `gigUpdateSchema` which is in `gig/src/schemes/gig.ts`
const gigUpdate = async (req: Request, res: Response): Promise<void> => {
  const { error } = await Promise.resolve(gigUpdateSchema.validate(req.body));
  if (error?.details) {
    throw new BadRequestError(error.details[0].message, 'Update gig() method');
  }
  // Before i uplaod, i need to check because im going to be sending a base64
  // encoded string. So i need to check if the user is uploading a new image
  // or they are still sending the previous image
  // So what im doing here is, i want to check if the cover image whatever is
  // sent, if its a base64 string or not? If its a base64 string, that means
  // the user is uploading a new image. But if its not a base64 encoded string,
  // it means that the user is still keeping the current image for the particular
  // gig.
  const isDataUrl = isDataURL(req.body.coverImage);
  let coverImage = '';
  if (isDataUrl) {
    // If isDataUrl is true, that means the user wants to upload a new gig.
    const result: UploadApiResponse = (await uploads(req.body.coverImage)) as UploadApiResponse;
    if (!result.public_id) {
      throw new BadRequestError('File upload error. Try again.', 'Update gig() method');
    }
    // If the upload is successful, then set the `secure_url` to this cover
    // image
    coverImage = result?.secure_url;
  } else {
    // If it is not `isDataURL()` that means, the user is keeping the current
    // image
    coverImage = req.body.coverImage;
  }

  // Constructing the properties that i want to update
  const gig: ISellerGig = {
    // These are the properties that i'll need for updates
    title: req.body.title,
    description: req.body.description,
    categories: req.body.categories,
    subCategories: req.body.subCategories,
    tags: req.body.tags,
    price: req.body.price,
    expectedDelivery: req.body.expectedDelivery,
    basicTitle: req.body.basicTitle,
    basicDescription: req.body.basicDescription,
    coverImage
  };
  const updatedGig: ISellerGig = await updateGig(req.params.gigId, gig);
  res.status(StatusCodes.CREATED).json({ message: 'Gig updated successfully.', gig: updatedGig });
};

// @ Method to just simply update the `active` property
const gigUpdateActive = async (req: Request, res: Response): Promise<void> => {
  const updatedGig: ISellerGig = await updateActiveGigProp(req.params.gigId, req.body.active);
  res.status(StatusCodes.CREATED).json({ message: 'Gig updated successfully.', gig: updatedGig });
};
export { gigUpdate, gigUpdateActive };
