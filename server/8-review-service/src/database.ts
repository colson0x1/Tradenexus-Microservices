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

// Create Database
const databaseConnection = async (): Promise<void> => {
  try {
    await pool.connect();
    log.info('Review service successfully connected to PostgreSQL database.');
  } catch (error) {
    log.error('ReviewService - Unable to connect to database.', error);
    log.log('error', 'ReviewService databaseConnection() method error:', error);
  }
};

export { databaseConnection };
