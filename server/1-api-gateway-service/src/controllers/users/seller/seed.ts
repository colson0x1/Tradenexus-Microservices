import { sellerService } from '@gateway/services/api/seller.service';
import { AxiosResponse } from 'axios';
import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';

// For this, i dont need to send any data to the client. I just need to call
// the api and then it will seed the data.
export class SellerSeed {
  public async seller(req: Request, res: Response): Promise<void> {
    const response: AxiosResponse = await sellerService.seed(req.params.count);
    res.status(StatusCodes.OK).json({ message: response.data.message });
  }
}
