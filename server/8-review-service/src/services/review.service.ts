// For this review service, im going to have only three methods. So im going
// to have the method to add to the table, method to retrieve by `gigId` and
// method to retrieve by `sellerId`.

import { IReviewDocument, IReviewMessageDetails } from '@colson0x1/tradenexus-shared';
import { pool } from '@review/database';
import { publishFanoutMessage } from '@review/queues/review.producer';
import { reviewChannel } from '@review/server';

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

export { addReview };
