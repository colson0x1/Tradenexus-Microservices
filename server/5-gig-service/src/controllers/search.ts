import { IPaginateProps, ISearchResult, ISellerGig } from '@colson0x1/tradenexus-shared';
import { gigsSearch } from '@gig/services/search.service';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sortBy } from 'lodash';

const gigs = async (req: Request, res: Response): Promise<void> => {
  // very similar to auth service search.service.ts
  const { from, size, type } = req.params;
  let resultHits: ISellerGig[] = [];
  const paginate: IPaginateProps = {
    from,
    size: parseInt(`${size}`),
    type
  };
  const gigs: ISearchResult = await gigsSearch(
    `${req.query.query}`,
    paginate,
    `${req.query.delivery_time}`,
    parseInt(`${req.query.minPrice}`),
    parseInt(`${req.query.maxPrice}`)
  );

  // What im doing here is, im looping because the method itself returns an
  // object that contains the `total` and then this `hits`. hits is an array.
  // So i need to loop through this `hits` array.
  for (const item of gigs.hits) {
    // Once i loop through the `hits`, the `_source` property inside each item,
    // that is what im pushing into this array `resultHits`.
    resultHits.push(item._source as ISellerGig);
  }

  // If the type is equal to backward, that means, if the user is clicking the
  // back button on the page for the pagination, then i sort by the `sortId`.
  if (type === 'backward') {
    resultHits = sortBy(resultHits, ['sortId']);
  }

  res.status(StatusCodes.OK).json({ message: 'Search gigs results', total: gigs.total, gigs: resultHits });
};

export { gigs };
