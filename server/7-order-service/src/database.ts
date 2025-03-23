import { winstonLogger } from '@colson0x1/tradenexus-shared';
import { Logger } from 'winston';
import { config } from '@order/config';
import mongoose from 'mongoose';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'orderDatabaseServer', 'debug');

// Create a connection
const databaseConnection = async (): Promise<void> => {
  try {
    // Connect to the database
    await mongoose.connect(`${config.DATABASE_URL}`);
    log.info('Order service successfully connected to database.');
  } catch (error) {
    log.log('error', 'OrderService databaseConnection() method error:', error);
  }
};

export { databaseConnection };
