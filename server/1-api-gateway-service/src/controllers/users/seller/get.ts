import { sellerService } from '@gateway/services/api/seller.service';
import { AxiosResponse } from 'axios';
import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';

export class Get {
  /* @ Get seller by id */
  public async id(req: Request, res: Response): Promise<void> {
    const response: AxiosResponse = await sellerService.getSellerById(req.params.sellerId);
    res.status(StatusCodes.OK).json({ message: response.data.message, seller: response.data.seller });
  }

  /* @ Get seller by username */
  public async username(req: Request, res: Response): Promise<void> {
    const response: AxiosResponse = await sellerService.getSellerByUsername(req.params.username);
    res.status(StatusCodes.OK).json({ message: response.data.message, seller: response.data.seller });
  }

  /* @ Get random sellers */
  public async random(req: Request, res: Response): Promise<void> {
    const response: AxiosResponse = await sellerService.getRandomSellers(req.params.size);
    // Here `data`  is going to be `sellers` because im returning `sellers`
    // array. So `response.data.sellers`
    res.status(StatusCodes.OK).json({ message: response.data.message, seller: response.data.sellers });
  }
}
