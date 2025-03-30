// For this review service, im going to have only three methods. So im going
// to have the method to add to the table, method to retrieve by `gigId` and
// method to retrieve by `sellerId`.

import { IReviewDocument, IReviewMessageDetails } from '@colson0x1/tradenexus-shared';
import { pool } from '@review/database';
import { publishFanoutMessage } from '@review/queues/review.producer';
import { reviewChannel } from '@review/server';
import { QueryResult } from 'pg';

const addReview = async (data: IReviewDocument): Promise<IReviewDocument> => {
  // If i want to create a document when using Mongo DB, then i cann the
  // `create` method and then i add the object i.e `data` into the create method.
  // But here its going to be a little bit different.
  // Im going to destructure the properties that i need from `data` object.
  // So im getting all of these properties from the `data`.
  const { gigId, reviewerId, reviewerImage, sellerId, review, rating, orderId, reviewType, reviewerUsername, country } = data;
  // And then i'll create a date.
  const createdAtDate = new Date();
  // Im going to execute a query with `pool.query()` and inside of it, i pass
  // the query i want to execute. Query returns an object and then the object
  // contains the raw data.
  const { rows } = await pool.query(
    // INSERT INTO the reviews table. And then the properties that i want to
    // insert. These are the fields in the table, not the actual values.
    // And then i want to INSERT into this particular columns.
    // $1 represents the value that will be added for this particular column.
    // Since there are 11 columns, so im adding 11 of these.
    // i.e, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11.
    // So these numbers will be replaced with the actual values for each
    // of these columns.
    // Then, after the insertion is complete, then i want to return all with *.
    // So returning all means, it will return the complete row. If i don't
    // return the complete row, i can specify the fields i want to return.
    // For example, if i want to return gigId, so that after it inserts, it will
    // return only the gigId. Then i do `RETURN (gigId)`. But here, i need to
    // return the complete row. So using asterisk.
    `INSERT INTO reviews (gigId, reviewerId, reviewerImage, sellerId, review, rating, orderId, reviewType, reviewerUsername, country, createdAt)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    // After the back ticks, i want to specify the values.
    // Order really matters. So those values i have there above ^ will be
    // replaced by what i have inside this list i.e below inside [].
    // So the positioning here really matters. Like first one is gigId here, then
    // it should also be gigId on the above. Else if the positions are not the
    // same, then it'll insert and return the wrong values. So whatever order
    // i specify there above to INSERT to, is the same order i have in this
    // list below.
    // So that above is the query that will insert into those different columns
    // and these below are the values that i want to insert into the column.
    [gigId, reviewerId, reviewerImage, sellerId, review, rating, orderId, reviewType, reviewerUsername, country, createdAtDate]
  );
  // Now what i want to do is, i need to create publisher because here im going
  // to publish an event. So im going to publish the review and im going to use
  // the fanout exchange.
  const messageDetails: IReviewMessageDetails = {
    gigId: data.gigId,
    reviewerId: data.reviewerId,
    sellerId: data.sellerId,
    review: data.review,
    rating: data.rating,
    orderId: data.orderId,
    createdAt: `${createdAtDate}`,
    type: `${reviewType}`
  };
  await publishFanoutMessage(
    reviewChannel,
    'tradenexus-review',
    // In this case, i don't need the routing key.
    JSON.stringify(messageDetails),
    // Order Service and Users Service are the services that will listen for
    // this Fanout exchange. So the Order service and the Users service will
    // both consume the messages being published by this Review service.
    'Review details sent to Order and Users services.'
  );

  // So that `rows` above is an array and then the value i need, because there
  // i said, it should return the complete row using *. Then what i need is
  // at index 0.
  return rows[0];
};

// Now im going to add two methods. One will be to get reviews by gigId and
// then the other will be to get reviews by sellerId.

// @ Method to get reviews by `gigId`.
const getReviewsByGigId = async (gigId: string): Promise<IReviewDocument[]> => {
  // In order to write the query, i need to pool the query. The above query
  // just returns query results. I just got rows. But here im returning the
  // complete query result.
  // So i want to get every row where the `gigId` matches whatever whatever
  // `gigId` i pass here and im going to SELECT command.
  // So SELECT all from reviews. `reviews` is the name of the table where
  // `reviews.gigId` is equal to $1 which is a placeholder. And then after the
  // strings, i will then add the brackets and then the `gigId`. So this is
  // the command i need. Its not a complex command. Im not having any kind of
  // join or multiple queries added. Its just very simple.
  // So SELECT all from reviews where `reviews.gigId` equals to `gigId`. Here
  // im using placeholder $1. When the query is executed, the $ symbol and 1
  // i.e $1 will be replaced by this `gigId` that i have in square brackets.
  const reviews: QueryResult = await pool.query('SELECT * FROM reviews WHERE reviews.gigId = $1', [gigId]);
  // And then here, i can easily just return because i want a list.
  // So it will be `reviews.rows`.
  return reviews.rows;
};

// @ Method to get reviews by `sellerId`.
const getReviewsBySellerId = async (sellerId: string): Promise<IReviewDocument[]> => {
  // For this im going to use conditions. I've this `reviewType` that im
  // inserting above. If the `reviewType` is coming from the buyer, it will be
  // `buyer-review` and if the `reviewType` is coming from the seller, it will
  // be `seller-review`. So im going to SELECT all reviews where `reviews.sellerId`
  // is equal to the `sellerId` in the square brackets. And then im going to
  // use the AND operator where `reviews.reviewType` is equal to $2.
  // Since i dont have another parameter passed in this method, so im going to
  // instead hardcode the value `seller-review`. So the value for $2 is going
  // to be `seller-review`.
  // So since im adding the review for sellers, so the review type is giong to
  // be `seller-review`. But if it a buyer, its going to be `buyer-review`.
  // Here im not adding any methods to get the buyers review. Maybe on the frontend,
  // i might decide in the future to display all the reviews added by a particular
  // buyer.
  // So SELECT all from reviews where `reviews.sellerId` is equal to `sellerId`
  // that i pass in the params and `reviews.reviewType` is `seller-review`.
  const reviews: QueryResult = await pool.query('SELECT * FROM reviews WHERE reviews.sellerId = $1 AND reviews.reviewType = $2', [
    sellerId,
    'seller-review'
  ]);
  return reviews.rows;
};

export { addReview, getReviewsByGigId, getReviewsBySellerId };
