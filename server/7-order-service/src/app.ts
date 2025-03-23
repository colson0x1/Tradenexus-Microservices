import { databaseConnection } from '@order/database';
import { config } from '@order/config';
import express, { Express } from 'express';
import { start } from '@order/server';

const initialize = (): void => {
  config.cloudinaryConfig();
  databaseConnection();
  // Create an instance of Express
  const app: Express = express();
  start(app);
};

initialize();
