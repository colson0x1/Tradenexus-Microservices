import { AxiosResponse } from 'axios';
import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import { gigService } from '@gateway/services/api/gig.service';

/* @ Controller method for getting gigs */
export class Get {
  // What are the methods i want to get is in the `gateway/src/services/api/gig.service.ts`
  // So there are all the GET methods there.

  public async gigById(req: Request, res: Response): Promise<void> {
    const response: AxiosResponse = await gigService.getGigById(req.params.gigId);
    res.status(StatusCodes.OK).json({ message: response.data.message, gig: response.data.gig });
  }

  public async getSellerGigs(req: Request, res: Response): Promise<void> {
    const response: AxiosResponse = await gigService.getSellerGigs(req.params.sellerId);
    // For response, im sending `gigs` because this is going to be an array
    res.status(StatusCodes.OK).json({ message: response.data.message, gigs: response.data.gigs });
  }

  public async getSellerPauedGigs(req: Request, res: Response): Promise<void> {
    const response: AxiosResponse = await gigService.getSellerPausedGigs(req.params.sellerId);
    res.status(StatusCodes.OK).json({ message: response.data.message, gigs: response.data.gigs });
  }

  public async getGigsByCategory(req: Request, res: Response): Promise<void> {
    const response: AxiosResponse = await gigService.getGigsByCategory(req.params.username);
    res.status(StatusCodes.OK).json({ message: response.data.message, gigs: response.data.gigs });
  }

  public async getMoreGigsLikeThis(req: Request, res: Response): Promise<void> {
    const response: AxiosResponse = await gigService.getMoreGigsLikeThis(req.params.gigId);
    res.status(StatusCodes.OK).json({ message: response.data.message, gigs: response.data.gigs });
  }

  public async getTopRatedGigsByCategory(req: Request, res: Response): Promise<void> {
    const response: AxiosResponse = await gigService.getTopRatedGigsByCategory(req.params.username);
    res.status(StatusCodes.OK).json({ message: response.data.message, gigs: response.data.gigs });
  }
}
