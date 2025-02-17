import { BadRequestError, ISellerDocument } from '@colson0x1/tradenexus-shared';
import { sellerSchema } from '@users/schemes/seller';
import { updateSeller } from '@users/services/seller.service';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

const seller = async (req: Request, res: Response): Promise<void> => {
  // validate with seller schemes
  const { error } = await Promise.resolve(sellerSchema.validate(req.body));
  if (error?.details) {
    throw new BadRequestError(error.details[0].message, 'Update seller() method error');
  }

  const seller: ISellerDocument = {
    profilePublicId: req.body.profilePublicId,
    fullName: req.body.fullName,
    // Here for the seller documents, two properites that i dont want to
    // update are the `username` and the `email`
    /*
    username: req.currentUser!.username,
    email: req.body.email,
     */
    // also note: the `username` and `email` as in buyer.schema.ts and seller.schema.ts,
    // so once the user is created, username and email cannot be changed i.e
    // they will not be able to update them.
    // The current approach im using there i.e
    // {
    //  username: { type: String, required: true, index: true }
    //  emial: { type: String, required: true, index: true }
    // }
    // That approach doesnt make sense if, users can have the option of
    // updating or changing their usernames or emails.
    // So that approach won't make sense because, if they use it multiple
    // times right there in the schema, it will probably like be challenged
    // if they update their username or update their emails and the different
    // collections, we have to look for where they were updated in different
    // collections and then update it. So it doesn't make sense that way.
    // Approach!
    // So if we plan on creating an application whereby the username can be
    // updated later once they are created or the email, then above approach
    // will not be good. What we can do is, we create a separate collection.
    // And then we reference the `username` and the `email` in whereever,
    // whatever collection we need to use them. So for example, we can create
    // a separate collections to add usernames and email. And then there i.e
    // in buyer.schema.ts and seller.schema.ts, we just reference the
    // username and the email. So if we update the collection, it will reflect
    // in all the other collections or documents where the username and the
    // emails are used.
    // So the reason why I added like that is because users will not be able
    // to update their username and email.
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

  const updatedSeller: ISellerDocument = await updateSeller(req.params.sellerId, seller);
  res.status(StatusCodes.OK).json({ message: 'Seller created successfully', seller: updatedSeller });
};

export { seller };
