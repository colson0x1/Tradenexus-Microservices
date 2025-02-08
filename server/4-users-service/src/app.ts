import { databaseConnection } from '@users/database';
import { config } from '@users/config';
import express, { Express } from 'express';
import { start } from '@users/server';

const initialize = (): void => {
  config.cloudinaryConfig();
  databaseConnection();
  // Create an instance of Express
  const app: Express = express();
  start(app);
};

initialize();
