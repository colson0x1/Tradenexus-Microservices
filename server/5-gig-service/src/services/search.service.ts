import { ISearchResult, IQueryList, IHitsTotal, IPaginateProps } from '@colson0x1/tradenexus-shared';
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types';
import { elasticSearchClient } from '@gig/elasticsearch';

// @ Elasticsearch Dev Tools
// `query` is one of the sellers id.
/*
GET gigs/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "query_string": {
            "fields": ["sellerId"],
            "query": "6547ee17bac1c154d4346071"
          }

        }
      ]
    }
  }
}
*/
export async function gigsSearchBySellerId(searchQuery: string, active: boolean): Promise<ISearchResult> {
  const queryList: IQueryList[] = [
    /* @ Search the fields and only return the active gigs */

    // This is the first set of query im adding
    // i.e Query to search the subcategories and then return every document with
    // the beauty text
    {
      query_string: {
        // Here, i only want to search the sellers field. So i only want to
        // search or return the gigs that matches the `sellerId` and then
        // that are also `active`. So if they are not `active`, i dont want to
        // return them.
        fields: ['sellerId'],
        // query: 'Beauty'
        query: `*${searchQuery}*`
      }
    },
    // Add another query to only return gigs in the search that are active
    {
      // Search for term with every active gig
      term: {
        // `active` is boolean coming from params. So if its true, it will
        // return all the active gigs for a particular user by the `sellerId`.
        // If it is false, it will return all the gigs that are not active for
        // a particular seller.
        active
      }
    }
  ];

  // Use elasticsearch client
  const result: SearchResponse = await elasticSearchClient.search({
    // Here we need to pass in some parameters
    // So, the name of the index
    index: 'gigs',
    query: {
      bool: {
        // Since queryList is an array, we just need to use the spread operator
        // So this will add everything we have inside our `queryList` to this
        // `must` parameter.
        must: [...queryList]
      }
    }
  });

  // Return the search result
  // If we search in Elasticsearch Dev Tools, we're get objects where we've
  // `hits` and inside the `hits`, we've another `hits` property which is
  // an array of objects!
  // Here im going to return the total heat and the total number of items
  // i.e i want to return `hits` array and then return the total value located
  // inside the `hits` object
  /* @ Here is the data structure of the returned response:
  {
   "hits": {
     "total": {
       "value": 30,
       "relation": "eq"
     },
     "max_score": 1,
     "hits": [
      {},
      {},
      {}
     ]
   }
  }
  */
  const total: IHitsTotal = result.hits.total as IHitsTotal;
  return {
    total: total.value,
    hits: result.hits.hits
  };
}

// Im going to add two more methods. The first method will be related to
// what i've already added to Auth service, which is i want to be able to
// search all of the fields like username, title, description and more.
/* @ Elasticsearch dev tool
 * GET gigs/_search
GET gigs/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "query_string": {
            "fields": ["username", "title", "description", "basicDescription", "basicTitle", "categories", "subCategories", "tags"],
            "query": "Beauty"
          }

        }
      ]
    }
  }
}
 * */
// The second method will be used to search by the categories. So the second
// method will just be used to get all documents where the category matches
// whatever category i want to search for.
/* @ Elasticsearch dev tool
 * GET gigs/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "query_string": {
            "fields": ["categories"],
            "query": "Music & Audio"
          }

        }
      ]
    }
  }
}
 * */
// So the first one will be to set the different fields and the second method
// will be to search for the categories only documents that matches whatever
// category i want to get the result for.
// Those two methods are `gigsSearch` and `gigsSearchByCategory`.

// `gigsSearch` is the same method i defined in `auth/src/services/search.service.ts`
export async function gigsSearch(
  searchQuery: string,
  paginate: IPaginateProps,
  deliveryTime?: string,
  min?: number,
  max?: number
): Promise<ISearchResult> {
  const { from, size, type } = paginate;
  const queryList: IQueryList[] = [
    {
      query_string: {
        // The first party of the query will be to search all of these fields for whatever
        // search query the user types or the user sends. So im going seach these
        // fields. If i have more fields that i want to search, then i can just
        // add them to this fields array.
        fields: ['username', 'title', 'description', 'basicDescription', 'basicTitle', 'categories', 'subCategories', 'tags'],
        query: `*${searchQuery}*`
      }
    },
    {
      term: {
        // The second part of the query is, i only want to search and return
        // active gigs. So this query will not return gigs where active is
        // set to false. I dont want to return inactive gigs in the search
        // response.
        // So the first part will search those fields and then this second
        // part will filter also so that it returns only active gigs.
        active: true
      }
    }
  ];

  // Now when a user has a result page the frontend, they can then filter by
  // either `deliveryTime` so maybe the user wants to filter the document or
  // the results by the `deliveryTime`. They want to see only gigs that have
  // a 2 day delivery time. Then they can select from the dropdown and then,
  // if this `deliveryTime` value is set and if its not undefined, then im
  // going to search the `expectedDelivery` field.
  // So what will happen is, if we filter, it will run the above query and then
  // because `deliveryTime` is not undefined, it will also check for this
  // particular field.
  if (deliveryTime !== 'undefined') {
    queryList.push({
      query_string: {
        fields: ['expectedDelivery'],
        query: `*${deliveryTime}*`
      }
    });
  }

  // And then the last one is, if i want to filter by the price, then i set a
  // minimum price and a maximum price. So every gig where the price falls
  // between the minimum and the maximum. So if the price is greater than or
  // equal to minimum or the price is less than or equal to the maximum, then
  // i return those gigs as well.
  if (!isNaN(parseInt(`${min}`)) && !isNaN(parseInt(`${max}`))) {
    queryList.push({
      range: {
        price: {
          gte: min,
          lte: max
        }
      }
    });
  }

  // So those are the queries above and then here, i just set the parameters
  // in the search.
  const result: SearchResponse = await elasticSearchClient.search({
    index: 'gigs',
    // size will be coming from the frontend because im going to implement
    // pagination
    size,
    query: {
      bool: {
        // add `queryList` into the `must` list
        must: [...queryList]
      }
    },
    // And then im sorting here. So if the type is `forward`, that is if the
    // user is clicking forward button on the pagination, then i sort the
    // result in ascending order by the `sortId`. If the type is `backward`,
    // i sort the `sortId` by in descending order.
    sort: [
      {
        sortId: type === 'forward' ? 'asc' : 'desc'
      }
    ],
    // And then here, based on the recommendations by Elasticsearch, if we are
    // expecting to return 10,000 documents, even though my documents will not
    // get up to 10,000. The default hits that we can return or search through
    // is 10,000. So anything above 10,000. The request for our pagination, i
    // need this `search_after`. So here im dynamically setting up this object,
    // so if the `from` property is not equal to 0. So for the first search
    // that the user performs, or the first result that the user gets, i set
    // this `from` to 0. And then if the user clicks on the next button, im
    // going to set this `from` to 1. And then here i set this `search_after`
    // or this `from` could be any other value as long as its not 0 and then
    // i call this `search_after`.
    ...(from !== '0' && { search_after: [from] })
  });

  // And then once i get the results, i want to get the total value and the
  // hits array, both from the `hits` object.
  const total: IHitsTotal = result.hits.total as IHitsTotal;
  return {
    total: total.value,
    hits: result.hits.hits
  };
}

export async function gigsSearchByCategory(searchQuery: string): Promise<ISearchResult> {
  const result: SearchResponse = await elasticSearchClient.search({
    index: 'gigs',
    // For size, i only want 10 documents so im hardcoding. Because here, i will
    // likely not add any form of pagination. So that's why i hardcoded them
    // right here.
    size: 10,
    query: {
      bool: {
        must: [
          {
            query_string: {
              // only field i want to search is `categories` field
              fields: ['categories'],
              query: `*${searchQuery}*`
            }
          },
          {
            term: {
              // and i only want to search for active documents
              active: true
            }
          }
        ]
      }
    }
  });

  // And then once i get the results, i want to get the total value and the
  // hits array, both from the `hits` object.
  const total: IHitsTotal = result.hits.total as IHitsTotal;
  return {
    total: total.value,
    hits: result.hits.hits
  };
}
