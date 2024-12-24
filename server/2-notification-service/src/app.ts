import { winstonLogger } from '@colson0x1/tradenexus-shared';
import { Logger } from 'winston';
import { config } from '@notifications/config';
import express, { Express } from 'express';
import { start } from '@notifications/server';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'notificationApp', 'debug');

function initialize(): void {
  // Instance of Express
  const app: Express = express();
  start(app);
  log.info('Notification Service Initialized');
}
initialize();
