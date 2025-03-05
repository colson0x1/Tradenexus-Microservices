import { winstonLogger } from '@colson0x1/tradenexus-shared';
import { Logger } from 'winston';
import { config } from '@chat/config';
import mongoose from 'mongoose';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'chatDatabaseServer', 'debug');

// Create a connection
const databaseConnection = async (): Promise<void> => {
  try {
    // Connect to the database
    await mongoose.connect(`${config.DATABASE_URL}`);
    log.info('Chat service successfully connected to database.');
  } catch (error) {
    log.log('error', 'ChatService databaseConnection() method error:', error);
  }
};

export { databaseConnection };
