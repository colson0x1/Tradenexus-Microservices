import { IBuyerDocument } from '@colson0x1/tradenexus-shared';
import { getBuyerByEmail, getBuyerByUsername } from '@users/services/buyer.service';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

/* @ Get buyer by email */
const email = async (req: Request, res: Response): Promise<void> => {
  // Get buyer
  const buyer: IBuyerDocument | null = await getBuyerByEmail(req.currentUser!.email);
  res.status(StatusCodes.OK).json({ message: 'Buyer profile', buyer });
};

/* @ Get buyer by current username */
const currentUsername = async (req: Request, res: Response): Promise<void> => {
  const buyer: IBuyerDocument | null = await getBuyerByUsername(req.currentUser!.username);
  res.status(StatusCodes.OK).json({ message: 'Buyer profile', buyer });
};

/* @ Get just by username */
// This one is going to come from req.params
// so the username will come from params
const username = async (req: Request, res: Response): Promise<void> => {
  const buyer: IBuyerDocument | null = await getBuyerByUsername(req.params.username);
  res.status(StatusCodes.OK).json({ message: 'Buyer profile', buyer });
};

export { email, username, currentUsername };
