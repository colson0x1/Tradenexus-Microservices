/* @ In order for us to be able to send a message or consume a message, we
 * need to create a connection. Because we're dealing with the Unit Test,
 * we want to test parts or units of an application or a service.
 * Integration test is if we want to integrate our tests with a database, we
 * want to connect our tests with a database, we want to connect it with
 * Elasticsearch, we want to connect it with RabbitMQ. So since we're not
 * dealing with integration test, we dont want to know if data is saved in
 * Elasticsearch, or if the data we want to test with is saving or is going
 * through RabbitMQ.
 * So since its just a simple unit test, Im going to mock. So im going to
 * mock those functions that I dont want to actually create. For example,
 * our createConnection inside email.consumer.ts, where I'll mock it because
 * JEST has a mock method we can use to mock that createConnection.
 * And then, we need to mock our assertQueue, because we dont want to create
 * an actual connection. We don't want to create an actual exchange, create an
 * actual queue. So we want to mock the exchange, mock the assert queue and
 * perhaps also the bind queue. So anything we need to do, we don't want to
 * create an actual connection. We'll need to mock them!
 */

import * as connection from '@notifications/queues/connection';
import amqp from 'amqplib';
import { consumeAuthEmailMessages, consumeOrderEmailMessages } from '@notifications/queues/email.consumer';

jest.mock('@notifications/queues/connection');
jest.mock('amqplib');
jest.mock('@colson0x1/tradenexus-shared');

// `describe` is used to group our tests
describe('Email Consumer', () => {
  // Since we're mocking
  beforeEach(() => {
    // Before each test block is executed, we reset all mocks
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  // If this method `consumeAuthEmailMessages` is called, we want to assert
  // and check that `assertExchange`, `assertQueue`, and `bindQueue` are called
  describe('consumeAuthEmailMessages method', () => {
    // `consumeAuthEmailMessages` should be called
    it('should be called', async () => {
      // mock to create a channel
      const channel = {
        assertExchange: jest.fn(),
        publish: jest.fn(),
        assertQueue: jest.fn(),
        bindQueue: jest.fn(),
        consume: jest.fn()
      };
      jest.spyOn(channel, 'assertExchange');
      // We're returning this mock value because assertQueue returns an object
      jest.spyOn(channel, 'assertQueue').mockReturnValue({ queue: 'auth-email-queue', messageCount: 0, consumerCount: 0 });
      // createConnection in connection.ts returns a channel. So we're returning
      // channel on mock return value.
      jest.spyOn(connection, 'createConnection').mockReturnValue(channel as never);
      // connection return a Channel or undefined in createConnection on
      // email.consumer.ts
      const connectionChannel: amqp.Channel | undefined = await connection.createConnection();
      await consumeAuthEmailMessages(connectionChannel!);

      // Assert that assertExchange was called with all of these properties
      // i.e (exchangeName, exchangeType)
      expect(connectionChannel!.assertExchange).toHaveBeenCalledWith('tradenexus-email-notification', 'direct');
      // Here we dont want to check if it was called with all of the properties
      // that it shuold be called with. But instead, we're gonna check that
      // this assertQueue was called at least once.
      expect(connectionChannel!.assertQueue).toHaveBeenCalledTimes(1);
      // check if consume method was also called
      expect(connectionChannel!.consume).toHaveBeenCalledTimes(1);
      // Assert that bindQueue was called with all of these properties
      // i.e (queueName, exchangeName, routingKey)
      expect(connectionChannel!.bindQueue).toHaveBeenCalledWith('auth-email-queue', 'tradenexus-email-notification', 'auth-email');
    });
  });

  /* @ Test for consumeOrderEmailMessages */
  describe('consumeOrderEmailMessages method', () => {
    it('should be called', async () => {
      const channel = {
        assertExchange: jest.fn(),
        publish: jest.fn(),
        assertQueue: jest.fn(),
        bindQueue: jest.fn(),
        consume: jest.fn()
      };
      jest.spyOn(channel, 'assertExchange');
      jest.spyOn(channel, 'assertQueue').mockReturnValue({ queue: 'order-email-queue', messageCount: 0, consumerCount: 0 });
      jest.spyOn(connection, 'createConnection').mockReturnValue(channel as never);
      const connectionChannel: amqp.Channel | undefined = await connection.createConnection();
      await consumeOrderEmailMessages(connectionChannel!);

      expect(connectionChannel!.assertExchange).toHaveBeenCalledWith('tradenexus-order-notification', 'direct');
      expect(connectionChannel!.assertQueue).toHaveBeenCalledTimes(1);
      expect(connectionChannel!.consume).toHaveBeenCalledTimes(1);
      expect(connectionChannel!.bindQueue).toHaveBeenCalledWith('order-email-queue', 'tradenexus-order-notification', 'order-email');
    });
  });
});
