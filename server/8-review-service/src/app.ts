import express, { Express } from 'express';
import { start } from '@review/server';

const initialize = (): void => {
  // Create an instance of Express
  const app: Express = express();
  start(app);
};

initialize();
