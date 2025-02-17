import { BadRequestError, ISellerDocument } from '@colson0x1/tradenexus-shared';
import { sellerSchema } from '@users/schemes/seller';
import { createSeller, getSellerByEmail } from '@users/services/seller.service';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

const seller = async (req: Request, res: Response): Promise<void> => {
  // validate with seller schemes
  const { error } = await Promise.resolve(sellerSchema.validate(req.body));
  if (error?.details) {
    throw new BadRequestError(error.details[0].message, 'Create seller() method error');
  }
  const checkIfSellerExist: ISellerDocument | null = await getSellerByEmail(req.body.email);
  // if `checkIfSellerExists` returns a document, that means it already exists
  if (checkIfSellerExist) {
    throw new BadRequestError('Seller already exist. Go to your account page to update.', 'Create seller() method error');
  }
  // So if there is no seller then i want to proceed constructing the seller
  // document
  // here im getting all from `req.body`
  const seller: ISellerDocument = {
    profilePublicId: req.body.profilePublicId,
    fullName: req.body.fullName,
    username: req.currentUser!.username,
    email: req.body.email,
    profilePicture: req.body.profilePicture,
    description: req.body.description,
    oneliner: req.body.oneliner,
    country: req.body.country,
    skills: req.body.skills,
    languages: req.body.languages,
    responseTime: req.body.responseTime,
    experience: req.body.experience,
    education: req.body.education,
    socialLinks: req.body.socialLinks,
    certificates: req.body.certificates
  };

  // the `createSeller` fn once it creates a seller, it also updates the buyer
  // property
  const createdSeller: ISellerDocument = await createSeller(seller);
  // status code is created because im creating a content here
  res.status(StatusCodes.CREATED).json({ message: 'Seller created successfully', seller: createdSeller });
};

export { seller };
