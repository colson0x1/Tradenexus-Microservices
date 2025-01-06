import { winstonLogger } from '@colson0x1/tradenexus-shared';
import { Logger } from 'winston';
import { config } from '@auth/config';
import { Sequelize } from 'sequelize';

// The reason name is added here in the log is because with this name exactly
// 'authDatabaseServer', we know where the log is coming from while
// viewing it through Kibana dashboard.
const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authDatabaseServer', 'debug');

// Im going to export an instance because im going to use it in our
// services
// i.e the reason why im exporting this Sequelize instance is because we'll
// need it inside our services when we want to make our queries.
export const sequelize = new Sequelize({
  // dialect is just like the type of database i.e mysql, postgresql, etc
  dialect: 'mysql',
  // do we want to log information
  logging: false,
  dialectOptions: {
    // So if we want to run, maybe we later decide to have more complex queries
    // and we want to be able to run multiple queries at the same time, then
    // we set multipleStatements to be true. i.e this command here will allow
    // us to run multiple queries
    multipleStatements: true
  }
});

// Set up the database connection
export async function databaseConnection(): Promise<void> {
  try {
    // Create the connection
    await sequelize.authenticate();
    log.info('AuthService MySQL database connection has been established');
  } catch (error) {
    log.error('Auth Servive - Unable to connect to database.');
    log.log('error', 'AuthService databaseConnection() method error:', error);
  }
}
