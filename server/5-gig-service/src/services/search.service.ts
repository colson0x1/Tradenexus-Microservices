import { ISearchResult, IQueryList, IHitsTotal } from '@colson0x1/tradenexus-shared';
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
