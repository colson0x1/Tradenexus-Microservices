import { AxiosResponse } from 'axios';
import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import { gigService } from '@gateway/services/api/gig.service';

export class GigSeed {
  /* @ Controller method for seeding a gig */
  public async gig(req: Request, res: Response): Promise<void> {
    const response: AxiosResponse = await gigService.seed(req.params.count);
    // We dont need to send any gig to the frontend. Just message is sufficient.
    res.status(StatusCodes.OK).json({ message: response.data.message });
  }
}
