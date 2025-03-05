import express, { Express } from 'express';
import { GatewayServer } from '@gateway/server';
import { redisConnection } from '@gateway/redis/redis.connection';

class Application {
  public initialize(): void {
    // Create an instance of express because that is what im passing into
    // the GatewatServer in server.ts
    const app: Express = express();
    const server: GatewayServer = new GatewayServer(app);
    server.start();
    redisConnection.redisConnect();
  }
}

const application: Application = new Application();
application.initialize();
