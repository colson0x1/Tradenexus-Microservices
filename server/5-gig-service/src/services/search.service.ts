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
const gigsSearchBySellerId = async (searchQuery: string, active: boolean): Promise<ISearchResult> => {
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
};

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
const gigsSearch = async (
  searchQuery: string,
  paginate: IPaginateProps,
  deliveryTime?: string,
  min?: number,
  max?: number
): Promise<ISearchResult> => {
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
};

const gigsSearchByCategory = async (searchQuery: string): Promise<ISearchResult> => {
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
};

// Elasticsearch similar looking documents method
// I want to create a method that i can use to return similar looking documents
// to a particular gig or to a particular document based on the ID. So for example,
// on the frontend, if the user clicks to view the complete information for a
// particular gig, then at the bottom of the screen, i want to add all the gigs
// that are similar to that particular gig. And Elasticsearch has some operators
// that i can use. So for example, if the user is currently viewing a Gig
// with a particular ID, i want to use Elasticsearch more like this operator to
// help me return gigs based on the id that looks similar. So i can have probably
// maybe 3 or 4 gigs that look similar to a particular gig that the user is
// viewing, and then i'll use the more like this operator to return those gigs.
/*
GET gigs/_search
{
  "query": {
    "more_like_this": {
       "fields": ["username", "title", "description", "basicDescription", "basicTitle", "categories", "subCategories", "tags"],
      "like": [
        {
          "_index": "gigs",
          "_id": "6547ee5f5c323d4335dfcc17"
        }
      ]
    }
  }
}
 * */
// So document with that `_id` is used as the reference. And then it will check
// the `username` field, `title`, `basicDescription`, and the other fields.
// And then look for terms that are similar to what exists in the same fields
// for this particular document i.e document with `_id`.
// Here, on the frontend this fn `getMoreGigsLikeThis` will be called when a
// user clicks to view the information for a particular gig. Then we make the
// request.
// So with this, if the gig has some similar looking gigs, then based off of the
// fields that i've specified here, its going to return it. Otherwise, its
// going to reutrn an empty array.
const getMoreGigsLikeThis = async (gigId: string): Promise<ISearchResult> => {
  const result: SearchResponse = await elasticSearchClient.search({
    index: 'gigs',
    // size im hardcoding this to only return 5. so if its more than 5, i want
    // to return only 5 documents.
    size: 5,
    query: {
      more_like_this: {
        fields: ['username', 'title', 'description', 'basicDescription', 'basicTitle', 'categories', 'subCategories', 'tags'],
        like: [
          {
            _index: 'gigs',
            _id: gigId
          }
        ]
      }
    }
  });
  const total: IHitsTotal = result.hits.total as IHitsTotal;
  return {
    total: total.value,
    hits: result.hits.hits
  };
};

// Method to return the highest rated gigs. So maybe i want to return gigs with
// 5 star ratings for a particular category. So for a particular category, I
// want to return all the gigs with the highest rating. So probably with the
// 5 star ratings.
// For this im going to be using Script Query in Elasticsearch. Script query
// is typically used in a filter context.
// Rating is the the `ratingSum` divided by the `ratingsCount`. So if the
// user has two ratings. So the first one is 5 star rating and the second one
// is the 5 star rating. The `ratingSum` will be 10 and then the `ratingsCount`
// will be 2 because they are two different ratings from maybe two different
// buyers. So now to calculate the rating, its going to be `ratingSum` divided
// by the `ratingsCount`. So im going to use it to get the actual rating.
// So that is the operation i want to perform. I want to use this filter script
// to calucuate the ratings. But i need to do a check because i don't want
// Elasticsearch to try to calculate for cases where the `ratingsCount` is 0.
// So if our `ratingsCount` is 0. And because we cant divide 0 by 0. So i dont
// want to return an error and cause of that im going to check if `ratingsCount`
// is not equal to 0. Then i divide `ratingSum` by `ratingsCount`.
// So here on Elasticsearch Dev Tools, the `lang` i will set that to `painless`
// and then for the `params`, im going to set a property called `threshold`. So
// the `threshold`, i'll set this to 5. This is the value i want to use so
// Elasticsearch can return the documents where the ratings for each document
// match this threshold. So if after doing the calculation, the rating is 4.5,
// then its not equal to this threshold. Its not going to return that document.
// But if the rating after the calculation is 5 and then its equal to this
// threshold, then Elasticsearch will return that document.
// Here on `source`, im getting `ratingSum` property's value from the `doc` if
// its not equal to 0 and if `doc` of `ratingSum` value divided by `doc` of
// `ratingsCount` value so if the `ratingSum` divided by the `ratingsCount`
// is equal to the threshold. And i can get the threshold from params.
// So what im doing in the `source` is, im checking if `ratingSum` value is not
// equal to 0 and then in the brackets `ratingSum` divided by `ratingsCount`
// value so if the result of this division is equal to the threshold's value,
// then return the documents. So that is what Elasticsearch will do.
/*
GET gigs/_search
{
  "query": {
    "bool": {
      "filter": {
        "script": {
          "script": {
            "source": "doc['ratingSum'].value != 0 && (doc['ratingSum'].value / doc['ratingsCount'].value === params['threshold'])",
            "lang": "painless",
            "params": {
              "threshold": 5
            }
          }
        }
      }
    }
  }
}
 * */
// One other thing i can do is, add specific fields to search. Like i want to
// search all the documents with the same category where all documents are top
// rated i.e 5 star rated.
/*
GET gigs/_search
{
  "query": {
    "bool": {
      "filter": {
        "script": {
          "script": {
            "source": "doc['ratingSum'].value != 0 && (doc['ratingSum'].value / doc['ratingsCount'].value == params['threshold'])",
            "lang": "painless",
            "params": {
              "threshold": 5
            }
          }
        }
      },
      "must": [
        {
          "query_string": {
            "fields": ["categories"],
            "query": "Writing & Translation"
          }

        }
      ]
    }
  }
}
 * */
const getTopRatedGigsByCategory = async (searchQuery: string): Promise<ISearchResult> => {
  const result: SearchResponse = await elasticSearchClient.search({
    index: 'gigs',
    // size im hardcoding this to only return 10. so if its more than 10, i want
    // to return only 10 documents.
    size: 10,
    query: {
      bool: {
        filter: {
          script: {
            script: {
              /* source: "doc['ratingSum'].value != 0 && (doc['ratingSum'].value / doc['ratingsCount'].value == params['threshold'])", */
              /* source: 'doc[\'ratingSum\'].value != 0 && (doc[\'ratingSum\'].value / doc[\'ratingsCount\'].value == params[\'threshold'])', */
              // eslint-disable-next-line
              source: "doc['ratingSum'].value != 0 && (doc['ratingSum'].value / doc['ratingsCount'].value == params['threshold'])",
              lang: 'painless',
              params: {
                threshold: 5
              }
            }
          }
        },
        must: [
          {
            query_string: {
              fields: ['categories'],
              query: `*${searchQuery}*`
            }
          }
        ]
      }
    }
  });
  const total: IHitsTotal = result.hits.total as IHitsTotal;
  return {
    total: total.value,
    hits: result.hits.hits
  };
};

// @ Test top rated gigs by category
// Here, inside this {}, i added the `doc` property which is an object and the
// specific fields that i want to update. If we dont add this `doc` property,
// it'll assume that we just want to replace the complete source. It will assume
// that we want to replace the content of the complete `_source` with a new
// document. So we make sure, that we always have this `doc` property, curly
// braces and then the fields we want to update.
/*
POST gigs/_update/6547ee735c323d4335dfcc33
{
  "doc": {
    "ratingsCount": 3,
    "ratingSum": 15
  }
}

GET gigs/_doc/6547ee735c323d4335dfcc33
 * */

export { gigsSearchBySellerId, gigsSearch, gigsSearchByCategory, getMoreGigsLikeThis, getTopRatedGigsByCategory };
