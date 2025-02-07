import { authService } from '@gateway/services/api/auth.service';
import { AxiosResponse } from 'axios';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export class Search {
  // Method to get the data of a single gig by passing in `gigId`
  public async gigById(req: Request, res: Response): Promise<void> {
    // We're going to get the `gigId` from params when the request comes
    // from the frontend.
    const response: AxiosResponse = await authService.getGig(req.params.gigId);
    // This `data` object is always going to contain our response that we're
    // sending from our endpoint or from the service because that is what is
    // included in AxiosResponse. So its coming from Axios.
    res.status(StatusCodes.OK).json({ message: response.data.message, gig: response.data.gig });
  }

  //
  public async gigs(req: Request, res: Response): Promise<void> {
    // Construct queries that we want to send
    const { from, size, type } = req.params;
    // See query before i construct them using object.forEach
    console.log('Query before:', req.query);
    // Construct a query to send to the Auth Service
    let query = '';
    // We're going to get our data from `req.query` but we need to convert it
    // into a key value pair inside the list or an array
    const objList = Object.entries(req.query);
    // Get the last index of the last item in the list
    const lastItemIndex = objList.length - 1;
    // Use forEach to convert an object into a list with key values and also the
    // index
    objList.forEach(([key, value], index) => {
      // So if the index in the loop is not equal to the lastItemIndex, then
      // appen the ampersand `&` symbol.
      /* `/auth/search/gig/0/10/forward?query=programming&delivery_time=3&minPrice=5&maxPrice=20` */
      // So here im constructing queries that i want to send to the auth service.
      // Its going to come from the frontend in a different format and then
      // here, im reconstructing it to the format so that we can send it to
      // the Auth Service.
      // Also, the reason why im constructing it this way is because the
      // `req.query` reuturns all the query params in an object but i don't
      // want to send it to the auth service as an object. So that is why i
      // constructed it this way.
      query += `${key}=${value}${index !== lastItemIndex ? '&' : ''}`;
    });
    // See it after the query has been constructed
    console.log('Query after:', query);
    const response: AxiosResponse = await authService.getGigs(`${query}`, from, size, type);
    res.status(StatusCodes.OK).json({ message: response.data.message, total: response.data.total, gigs: response.data.gigs });
  }
}
