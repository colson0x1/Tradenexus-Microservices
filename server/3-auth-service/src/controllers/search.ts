import { gigById, gigsSearch } from '@auth/services/search.service';
import { IPaginateProps, ISearchResult } from '@colson0x1/tradenexus-shared';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sortBy } from 'lodash';

// Function to search and get the result for multiple gigs.
export async function gigs(req: Request, res: Response): Promise<void> {
  const { from, size, type } = req.params;
  // Note: `hits` is an array. I only need whats there in the `_source`
  // inside the `hits`.
  // i.e loop through the `hits` array and get the `_source`.
  let resultHits: unknown[] = [];
  const paginate: IPaginateProps = {
    // `size` has to be a number. Because any value we pass through our
    // request params is going to always be a string.
    from,
    size: parseInt(`${size}`),
    type
  };
  const gigs: ISearchResult = await gigsSearch(
    `${req.query.query}`,
    paginate,
    // So if the user wants to filter by the delivery time, im going to add
    // it to the query as well
    `${req.query.delivery_time}`,
    parseInt(`${req.query.minPrice}`),
    parseInt(`${req.query.maxPrice}`)
  );

  // `gigs` is going to return `hits`
  // Now get the actual `_source`
  for (const item of gigs.hits) {
    // I only want the `_source` property here
    resultHits.push(item._source);
  }

  // Consider a case if type is equal to backward so if the user clicks
  // backward then we need to sort by.
  if (type === 'backward') {
    // Sorting by `id`
    // i.e lets say the user, when the user clics on the forward button, they
    // click until they get to the end of the page and they're viewing the last
    // document and then when they click the back button, the same results we're
    // gettung, we're going to get get the same result, but im going to sort
    // it by `sortId`. So if it started from 1, 2 or 3, 4 upward, then if we
    // sort by the `sortId`, then its going to return 5, 4, 3, 2, 1 just like
    // that.
    resultHits = sortBy(resultHits, ['sortId']);
  }

  // So once all of those above operations are performed,send this results
  res.status(StatusCodes.OK).json({ message: 'Search gigs results', total: gigs.total, gigs: resultHits });
}

// Function to get just the information for one single gig.
export async function singleGigById(req: Request, res: Response): Promise<void> {
  const gig = await gigById('gigs', req.params.gigId);
  res.status(StatusCodes.OK).json({ message: 'Single gig result', gig });
}
