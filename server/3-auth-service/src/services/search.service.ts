import { elasticSearchClient, getDocumentById } from '@auth/elasticsearch';
import { IHitsTotal, IPaginateProps, IQueryList, ISearchResult, ISellerGig } from '@colson0x1/tradenexus-shared';
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types';
import { parseInt } from 'lodash';

// Feature: Search for a particular gig.
// So if the user is on the index page or not yet logged in, and then they
// search for gigs and then they want to read more information about a
// particular gig, they click on it. And then this, method `gigById()` will be
// called and it will return the information related to that particular gig.
export async function gigById(index: string, gigId: string): Promise<ISellerGig> {
  const gig: ISellerGig = await getDocumentById(index, gigId);
  return gig;
}

/* @ Elastic search Dev Tools
 * GET gigs/_search
 * */
// @ Searches im going to perform:
// If user enters the text 'outdoor', Elasticsearch will search through all
// the fields specified. It will go through fields like `username`, `title`,
// `description` and every document that has this property that the user typed
// into the searchbox that we're sending as a query param. Then Elasticsearch
// will return those documents.
// Im also going to search by `expectedDelivery` field. SO that is going to be
// based on maybe the user wants to filter. So after searching for some
// documents and maybe it returns 20 results. Then the user wants to filter by
// expected delivery date. So maybe they want to see only documents that the
// expected delivery date is just one day. So im going to filter by this
// `expectedDelivery` too. And then im also going to filter by the minimum and
// maximum price. So every number that falls between the minimum and the
// maximum, im going to return. Also search and filter based on ratings i.e
// get all documents that have five star ratings or all gigs with five star
// ratings or all gigs with maybe 4.5 to 5 stars.
// So those are the properties im going to search.
export async function gigsSearch(
  searchQuery: string,
  paginate: IPaginateProps,
  // Filter by delivery day
  deliveryTime?: string,
  // Filter the document by the min and max price
  min?: number,
  max?: number
): Promise<ISearchResult> {
  const { from, size, type } = paginate;
  // Because im going to use multiple search inside this list, i will separate
  // them
  const queryList: IQueryList[] = [
    /* @ Search the fields and only return the active gigs */

    // This is the first set of query im adding
    // i.e Query to search the subcategories and then return every document with
    // the beauty text
    {
      query_string: {
        fields: ['username', 'title', 'description', 'basicDescription', 'basicTitle', 'categories', 'subCategories', 'tags'],
        query: 'Beauty'
      }
    },
    // Add another query to only return gigs in the search that are active
    {
      // Search for term with every active gig
      term: {
        active: true
      }
    }
  ];

  // `deliveryTime?` is optional. It means that probably when the user is
  // searching for those fields listed above, im not going to search the
  // `expectedDelivery` field.
  // So this `deliveryTime` will be used for filtering. So maybe the user
  // has a type search for documents and then have the user has result being
  // displayed. And the user wants to filter by the expected delivery date.
  // So for example, the user has 20 documents or results from the previous
  // search from the first query i.e query with fields, and then user wants to
  // filter the result of that query. So the user wants to get results based
  // on the expected delivery. So that is where this particular query will be
  // called. But by default, its going to be undefined.
  if (deliveryTime !== 'undefined') {
    // If delivery time is not equal to undefined, just push the new query
    // into that list
    queryList.push({
      query_string: {
        fields: ['expectedDelivery'],
        query: `*${deliveryTime}*`
      }
    });
  }

  // Query to perform some range checks
  // So we want to check the price because the price is a number. And we want
  // to get every document that matches the minimum and the maximum that the
  // user will input. So the user will use the minimum and maximum fields to
  // filter as well. So every document that matches the minimum and maximum that
  // is in between the minimum and maximum, im going to return.
  if (!isNaN(parseInt(`${min}`)) && !isNaN(parseInt(`${max}`))) {
    queryList.push({
      range: {
        // `price` is the field we want to check
        price: {
          // I want to return every document where the price is greater than
          // or equal to the minimum and also less than or equal to the maximum
          gte: min,
          lte: max
        }
      }
    });
  }

  // Use elasticsearch client
  const result: SearchResponse = await elasticSearchClient.search({
    // Here we need to pass in some parameters
    // So, the name of the index
    index: 'gigs',
    // the size
    size,
    query: {
      bool: {
        // Since queryList is an array, we just need to use the spread operator
        // So this will add everything we have inside our `queryList` to this
        // `must` parameter.
        must: [...queryList]
      }
    },
    // So that's the search above
    // Now i need one more thing i.e sort. The reason why im adding sorting is
    // simply because of the pagination. On the search page, im going to
    // implement the forward button and the backward button. So if the user
    // clicks forward then they should go and see the documents or get more
    // documents. Or if they click backward, they should get documents that
    // they've already seen before. That is how the sorting is going to work.
    // So I'll add the sort array right here and then the field.
    sort: [
      {
        // I want to sort by this property `sortId`. Every document that
        // im going to add will have a `sortId` property. So as i add it to
        // Elasticsearch, it will get sort. So the first document will have a
        // sortId of 1, the second document will have two and just like that.
        // So the document will help us in sorting.
        // This `sortId` is not added by Elasticsearch. Im adding it so that
        // I can use it for searching. I can't use `id` because the `id` is a
        // string and it does not work efficiently as when we use a number.
        // So here, on the frontend, if the user clicks the forward button, im
        // going to sort in ascending order and if the type is backward, then
        // im going to sort in descending order.
        sortId: type === 'forward' ? 'asc' : 'desc'
      }
    ],
    // From the documentation, `from` by default cannot page through more than
    // 10000 hits. To page more hits, we have to use the `search_after`
    // So here if `from` is not equal to 0. Because for the first search.
    // Lets say the size was 10. The first search, we dont need to perform
    // any kind of pagination for the first search. So the first time the
    // user gets a result, we don't need to perform any pagination. So im
    // checking if `from`. So for the first search, im going to set this
    // property to 0. So if `from` is not equal to 0, then we know that,
    // the user is performing the pagination. So here im setting an object
    // `search_after` and then the property i want to search `from` is 0.
    // So what this below line means is:
    // Lets say, we have search results: 0, 1, 2, 3, 4, 5, 6, 7, 8 , 9
    // So what this means is, lets say for the first search, the user gets
    // the first element 0 and 1. So when the result is returned, this
    // `from` property will be set to one because one was the last result that
    // the user returned. Now if the user clicks on the forward button, then
    // Elasticsearch will start the pagination from the number after the last
    // number. So because the last result was one, then the new search will
    // start from two. So it will return two and three and then send the
    // result to the user. And then when the user clicks on the forward
    // button. Again, it will set this `from` to 3 and then Elasticsearch
    // will see where we need to start the next search. And then, it will
    // start from 4 and then return 5. If for example, the user wants to return
    // three documents, the first search will return 0, 1, 2. And then, our
    // `from` will be set to 2. And then, when a new search is performed i.e
    // the forward button is clicked, then `from` will be set to 2. And then
    // Elasticsearch will start the new search from the value immediately
    // after 2 which is 3. So it will return 3, 4 and 5. And then once it
    // returns the result, on the frontend, im going to set `from` to 5
    // because 5 is the last item in the new result. And then when the user
    // clicks on the forward button again, i set `from` to 5 and then
    // Elasticsearch will use it. So the last item was 5. So the new search
    // will start from 6. So it will return 6 7 8.
    // So that is why on the frontend, im always going to be setting this
    // `from` property
    ...(from !== '0' && { search_after: [from] })
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

/* @ Elasticsearch Dev Tools
 * @ `gigsSearch` fn implementation in Elasticsearch Dev tools
# Get data from index
# Index name: logs-2025.01.17
# `_search` command is used to return all the documents we've inside this particular index.
# GET logs-2025.01.17/_search

# GET gigs/_search

# Add test documents to gigs
POST gigs/_create/1
{
  "name": "Stillie",
  "message": "Wsp"
}

# Get all gigs
GET gigs/_search

# Search the subcategories and then return every document with the beauty text
GET gigs/_search
{
  "query": {
    "bool": {
      # Inside this must, that is where we can add the different queries that we want to use.
      "must": [
        {
          # The first set of query will be searchQuery. So we want to query using this searchQuery parameter. And we want to query properties like username, title, description.,
          "query_string": {
            # Here we specify the field we want to search like username field, title field etc.
            "fields": ["username", "title", "description", "basicDescription", "basicTitle", "categories", "subCategories", "tags"],
            "query": "Beauty"
            # To search something thats in between, use asterisk
            # "query": "*rios*"
          }

        }
      ]
    }
  }
}
*/
