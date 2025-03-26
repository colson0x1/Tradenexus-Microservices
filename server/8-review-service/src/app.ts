import express, { Express } from 'express';
import { start } from '@review/server';
import { databaseConnection } from '@review/database';

const initialize = (): void => {
  // Create an instance of Express
  const app: Express = express();
  databaseConnection();
  start(app);
};

initialize();
