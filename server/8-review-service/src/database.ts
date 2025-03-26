// For Review Service, im going to use PostgreSQL. So the review data, anytime
// one is created either by the buyer or the seller, its going to add it as a
// row to the Postgres table. For this instead of using sequelize, im going to
// use `pg` library instead.
// Im going to write SQL queries. Its going to be simple because im going to
// have only one table to just add rows and then retrieve data from the table.

import { winstonLogger } from '@colson0x1/tradenexus-shared';
import { Logger } from 'winston';
import { config } from '@review/config';
import { Pool } from 'pg';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'reviewDatabaseServer', 'debug');

// In order to start, i can either create a client or either create a pool.
// If i use the `Client`, it will create the client once. But for the `Pool`,
// if i use Pool to setup my client then it will create it lazily. That means
// it will create the client when it is needed.

// This `new Pool` will create the client. That is the client i will need to
// connect to and then i pass in all of these properties. So here im creating
// a client using this `Pool`.
const pool: Pool = new Pool({
  host: `${config.DATABASE_HOST}`,
  user: `${config.DATABASE_USER}`,
  password: `${config.DATABASE_PASSWORD}`,
  port: 5432,
  database: `${config.DATABASE_NAME}`
});

// Using pool to listen for any errors
// So this is just to listen for the error event.
pool.on('error', (error: Error) => {
  log.log('error', 'pg client error', error);
  process.exit(-1);
});

// Here im creating a table. Its possible i can create it in a separate file.
// But since this is a very simple service, and the table is going to be
// very simple, i decided to create it inside this database.ts file.
// So here, once i execute this query, i check if the table does not exist i.e
// if there is no table called `reviews` then create a table. Buf if the table
// already exists, then skip it. So that is what this `CREATE TABLE IF NOT EXISTS public.reviews`
// does.
//  `id SERIAL PRIMARY KEY` means i want to generate unique integer numbers.
//  The `SERIAL` data type allows to automatically generate unique integer numbers.
// `gigId` is going to be text because my `gigId` from MongoDB is alphanumeric
// and then i'll not allow it to be null so it cannot be empty.
//  `review` is going to be actual review text.
//  `reviewType` is going to be buyer review or seller review. So if the review
//  is coming from buyer, its going to be buyer review and if the review is
//  coming from the seller, its going to be seller review. So i will get all
//  the reviews where the seller id matches whatever id im going to pass.
//  `rating` is going to be a integer with default value of 0 and is not null.
//  `CURRENT_DATE` is available in Postgres.
//  And the last property, i need to make this id primary key. So the id is going
//  to be the primary key.
//  So this is the query i need to run in order for me to create my table.
//  So i check if the table does not exist, then create the table but if the
//  table exists, then skip the query.
//  Now im going to add  indexes to my `gigId` because im going to search by
//  `gigId`. And also im going to add index to the `sellerId`.
//  So here im saying, create index if the index does not already exist.
//  But if the index already exists then there is no need creating the index.
//  The index name is `gigId_idx`. This is just the name used by the Postgres
//  database. Now where do i want to create the index on the table is
//  `public.reviews` i.e `reviews` table and the field is called `gigId`.
//  So here im creating indexes for my `gigId` and `sellerId`.
const createTableText = `
  CREATE TABLE IF NOT EXISTS public.reviews (
    id SERIAL UNIQUE,
    gigId text NOT NULL,
    reviewerId text NOT NULL,
    orderId text NOT NULL,
    sellerId text NOT NULL,
    review text NOT NULL,
    reviewerImage text NOT NULL,
    reviewerUsername text NOT NULL,
    country text NOT NULL,
    reviewType text NOT NULL,
    rating integer DEFAULT 0 NOT NULL,
    createdAt timestamp DEFAULT CURRENT_DATE,
    primary key (id)
  );

  CREATE INDEX IF NOT EXISTS gigId_idx ON public.reviews (gigId);

  CREATE INDEX IF NOT EXISTS sellerId_idx ON public.reviews (sellerId);
`;

// Create Database
const databaseConnection = async (): Promise<void> => {
  try {
    await pool.connect();
    //  So whenever i connect to the database successfully, then i want to
    //  execute this `createTableText` query.
    //  And then query, it will check if the table does not exist, it will
    //  create the table. Otherwise if it exists, it will skip. And then it will
    //  also check if those indexes have also been created. Otherwise it will
    //  create the indexes.
    await pool.query(createTableText);
    log.info('Review service successfully connected to PostgreSQL database.');
  } catch (error) {
    log.error('ReviewService - Unable to connect to database.', error);
    log.log('error', 'ReviewService databaseConnection() method error:', error);
  }
};

export { databaseConnection };
