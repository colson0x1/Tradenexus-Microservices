import { ISellerDocument } from '@colson0x1/tradenexus-shared';
import { getRandomSellers, getSellerById, getSellerByUsername } from '@users/services/seller.service';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

// get seller by id method
const id = async (req: Request, res: Response): Promise<void> => {
  const seller: ISellerDocument | null = await getSellerById(req.params.sellerId);
  res.status(StatusCodes.OK).json({ message: 'Seller profile', seller });
};

// get seller by username method
const username = async (req: Request, res: Response): Promise<void> => {
  const seller: ISellerDocument | null = await getSellerByUsername(req.params.username);
  res.status(StatusCodes.OK).json({ message: 'Seller profile', seller });
};

// get random sellers
const random = async (req: Request, res: Response): Promise<void> => {
  const sellers: ISellerDocument[] = await getRandomSellers(parseInt(req.params.size, 10));
  res.status(StatusCodes.OK).json({ message: 'Random sellers profile', sellers });
};

export { id, username, random };
