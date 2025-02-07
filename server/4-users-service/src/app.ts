import { databaseConnection } from '@users/database';
import { config } from '@users/config';

const initialize = (): void => {
  config.cloudinaryConfig();
  databaseConnection();
};

initialize();
