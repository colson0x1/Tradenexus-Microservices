import { IMessageDocument, IOrderDocument, IOrderNotifcation, winstonLogger } from '@colson0x1/tradenexus-shared';
import { Logger } from 'winston';
import { config } from '@gateway/config';
import { GatewayCache } from '@gateway/redis/gateway.cache';
import { Server, Socket } from 'socket.io';
import { io, Socket as SocketClient } from 'socket.io-client';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'gatewaySocket', 'debug');
// The reason why im not adding this `chatSocketClient` in the class itself
// is because i dont want to initialize this in the constructor. So if i add
// this to the class, then i'll have to instantiate it or initialize it inside
// the constructor and i dont want to do that so im creating this variable.
let chatSocketClient: SocketClient;
let orderSocketClient: SocketClient;

export class SocketIOAppHandler {
  private io: Server;
  private gatewayCache: GatewayCache;

  // Create constructor so that i can initialize the values
  constructor(io: Server) {
    this.io = io;
    // So im creating an instance of GatewayCache
    this.gatewayCache = new GatewayCache();
    // Im calling this `chatSocketServiceIOConnections` first inside this constructor
    // because the first time when this service runs, i connect i.e when this
    // class `SocketIOAppHandler` is initialized or instantiated, i connect.
    this.chatSocketServiceIOConnections();
    this.orderSocketServiceIOConnections();
  }

  public listen(): void {
    // I also want to call this `chatSocketServiceIOConnections` here inside
    // this listen method. The reason why im calling this inside this listen
    // method is so incase the Chat service restarts. Because if i dont call
    // this here, and maybe the Chat service for some reason there was a
    // disconnection, it will not connect automatically. So i want the connection
    // to be established automatically if there's an issue with the Chat service.
    // And then i call it in this listen method. SO here the Chat connection
    // will be established. For example, maybe i stopped Chat service, then
    // im going to get error logs in the console and then if i restart it, i
    // restart the Chat service. So i want the connection to be established
    // automatically.
    this.chatSocketServiceIOConnections();
    this.orderSocketServiceIOConnections();

    this.io.on('connection', async (socket: Socket) => {
      // The first thing i want to do is, use this `getLoggedInUsersFromCache`
      // from gateway.cache.ts. For that, im going to listen for an event
      // coming from the Frontend. So the event will come from the fontend.
      // Im going to send the event with Socket.IO client from React application.
      // So im going to send this event `getLoggedInUsers` from the frontend so
      // i listen for the events here, and inside this callback below, i call
      // the `getLoggedInUsersFromCache` method. And then once i get back the
      // response, im going to send it back to the frontend.
      // So im listening for event from the frontend, and then get the data
      // from Redis and then emit it back to the frontend. So on the frontend,
      // im going to listen for an `online` event.
      // So this is how im going to get the logged in user data.
      socket.on('getLoggedInUsers', async () => {
        // And then inside this, once i listen for this event, im going to use
        // it to get the logged in users from the cache.
        // Here im passing the key `loggedInUsers`. it can be anything.
        const response: string[] = await this.gatewayCache.getLoggedInUsersFromCache('loggedInUsers');
        // Once i get the response, i'll send it back to the frontend.
        this.io.emit('online', response);
      });

      // Listening for another event called `loggedInUsers`. So once i listen for
      // this event, im going to call this method `saveLoggedInUserToCache` to
      // save the username.
      socket.on('loggedInUsers', async (username: string) => {
        // `saveLoggedInUserToCache` is going to need a key and a value. The
        // key, im going to call it `loggedInUsers` and the value is going to be
        // the username.
        const response: string[] = await this.gatewayCache.saveLoggedInUserToCache('loggedInUsers', username);
        this.io.emit('online', response);
      });

      // Another event to remove if a user is logged out.
      socket.on('removeLoggedInUser', async (username: string) => {
        const response: string[] = await this.gatewayCache.removeLoggedInUserFromCache('loggedInUsers', username);
        // So when i get the new response, i send it back to the frontend.
        this.io.emit('online', response);
      });

      // Anytime user clicks on a particular gig to view the complete information,
      // im going to emit this event `category` from frontend.
      // So here im passing category of type string and the user that is sending
      // this.
      socket.on('category', async (category: string, username: string) => {
        // Its coming from from gateway cache but i dont need to return any result.
        await this.gatewayCache.saveUserSelectedCategory(`selectedCategories:${username}`, category);
      });
    });
  }

  /* @ Socket.IO - Client/Server Connection Architecture
   * I've the setup here above i.e im listening for the `connection` which is a
   * socket connection but this is only going to be for the `connection` that is
   * coming from the Frontend.
   * The API Gateway needs to act as the Client for the Chat service. But here,
   * its acting as the Server for the Frontend which acts as the Client.
   * So now im setting it up so that it also acts as the Client for the Chat
   * service. And to do that, i'll be installing and using the `socket.io-client`.
   * */
  /* @ Method that handles the connection coming from the Chat Service */
  private chatSocketServiceIOConnections(): void {
    // Initializing this `chatSocketClient` variable that i created which is
    // coming from the `socket.io-client` library
    chatSocketClient = io(config.MESSAGE_BASE_URL, {
      // Setting transports to use the websocket connection and then if websocket
      // is not available, then it should use polling. So this is what socket.io
      // client will do. it will use the websocket connection and if its not
      // available then it will try to use polling!
      transports: ['websocket', 'polling'],
      secure: true
    });

    // For client side, its `connect` event and for server side, its `connection`.
    // And since this API Gateway is acting as a Client for the Chat Service so.
    chatSocketClient.on('connect', () => {
      // So if the connection is established between the API gateway and the
      // Chat Service, i should see this message in the console.
      log.info('ChatService socket connected');
    });

    // If there's disconnection, i can listen for the `disconnect` event.
    // i.e if there's a disconection, i log the reason and then i try to
    // connect again.
    chatSocketClient.on('disconnect', (reason: SocketClient.DisconnectReason) => {
      // So if there's a disconnection, im logging and then i try to connect.
      log.log('error', 'ChatSocket disconnect reason:', reason);
      // Try to connect again.
      chatSocketClient.connect();
    });

    // Im listening for another built-in event. So these events, they're coming
    // from socket.io client.
    chatSocketClient.on('connect_error', (error: Error) => {
      // So if there's a `connect_error` event, i log and then try to reconnect.
      log.log('error', 'ChatService socket connection error:', error);
      chatSocketClient.connect();
    });

    /* @ Custom SocketIO events */

    // In the callback, the data that is coming from the event from the Chat
    // service is of type IMessageDocument
    // So here i listen for event from the Chat service and then in the callback,
    // i send this event to the frontend.
    chatSocketClient.on('message received', (data: IMessageDocument) => {
      // Now what do i want to do with this message is, i want to send the
      // message to the frontend. So I want to send the message. Once i receive
      // the message from the Chat service, i receive it here here in the API
      // gateway. Now i want to send it to the frontend.
      // Here im passing the same event name i.e `message received`. So on the
      // frontend, im going to listen for this same event.
      this.io.emit('message received', data);
    });

    chatSocketClient.on('message updated', (data: IMessageDocument) => {
      this.io.emit('message updated', data);
    });
  }

  /* @ Socket.IO connection for Order Service */

  private orderSocketServiceIOConnections(): void {
    orderSocketClient = io(config.ORDER_BASE_URL, {
      transports: ['websocket', 'polling'],
      secure: true
    });

    orderSocketClient.on('connect', () => {
      log.info('OrderService socket connected');
    });

    orderSocketClient.on('disconnect', (reason: SocketClient.DisconnectReason) => {
      log.log('error', 'OrderSocket disconnect reason:', reason);
      chatSocketClient.connect();
    });

    orderSocketClient.on('connect_error', (error: Error) => {
      log.log('error', 'OrderService socket connection error:', error);
      chatSocketClient.connect();
    });

    /* @ Custom SocketIO events */

    chatSocketClient.on('order notification', (order: IOrderDocument, notification: IOrderNotifcation) => {
      // Simply emit this event to the frontend.
      // NOTE: This is the only event that im going to be sending from the
      // order service to this api gateway.
      this.io.emit('order notification', order, notification);
    });
  }
}
