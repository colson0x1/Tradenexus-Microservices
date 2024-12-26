import 'express-async-errors';
import http from 'http';

import { winstonLogger } from '@colson0x1/tradenexus-shared';
import { Logger } from 'winston';
import { config } from '@notifications/config';
import { Application } from 'express';
import { healthRoutes } from '@notifications/routes';
import { checkConnection } from '@notifications/elasticsearch';
import { createConnection } from '@notifications/queues/connection';
import { Channel } from 'amqplib';
import { consumeAuthEmailMessages, consumeOrderEmailMessages } from '@notifications/queues/email.consumer';

const SERVER_PORT = 4001;
const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'notificationServer', 'debug');

export function start(app: Application): void {
  startServer(app);
  app.use('', healthRoutes());
  startQueues();
  startElasticSearch();
}

async function startQueues(): Promise<void> {
  const emailChannel: Channel = (await createConnection()) as Channel;
  await consumeAuthEmailMessages(emailChannel);
  await consumeOrderEmailMessages(emailChannel);

  await emailChannel.assertExchange('tradenexus-email-notification', 'direct');
  const message = JSON.stringify({ name: 'tradenexus', service: 'auth notification service' });
  emailChannel.publish('tradenexus-email-notification', 'auth-email', Buffer.from(message));

  await emailChannel.assertExchange('tradenexus-order-notification', 'direct');
  const message1 = JSON.stringify({ name: 'tradenexus', service: 'order notification service' });
  emailChannel.publish('tradenexus-order-notification', 'order-email', Buffer.from(message1));
}

function startElasticSearch(): void {
  checkConnection();
}

function startServer(app: Application) {
  try {
    // @ An instance of http server
    // There are cases where we might be using another service or another
    // library that has this server (i.e Server from `http.Server`) as an
    // export so it might be a conflict. So its just better `http.Server`
    const httpServer: http.Server = new http.Server(app);
    // Each process has a pid
    log.info(`Worker with process id of ${process.pid} on notification server has started`);
    httpServer.listen(SERVER_PORT, () => {
      log.info(`Notification server running on port ${SERVER_PORT}`);
    });
  } catch (error) {
    // Send log message to Elasticsearch
    // It takes a log level, message and a optional callback
    log.log('error', 'NotificationService startServer() method', error);
  }
}
