import dotenv from 'dotenv';
import cloudinary from 'cloudinary';

dotenv.config({});

/* @ APM Server
After i have the docker compose file for APM Server, i will install and use
the Node.js Agent because in the services that i want metrics to be collected
from, i need to setup an Agent. And the APM has a Node.js agent library
that i can use. And the APM has a Node.js Agent library that i can use.
The Elastic APM Node.js Agent sends performance metrics and errors to the
APM Server. So this Agent will be used to collect the metrics.
Im going to setup using `commonJS` way!
And i need to add it in a file that is called when the application starts.
i.e I can either add it to the `app.ts` or `config.ts`.
I've decided to go with `config.ts`.

https://www.elastic.co/guide/en/apm/agent/nodejs/current/express.html
https://www.elastic.co/guide/en/apm/agent/nodejs/current/configuration.html
*/
if (process.env.ENABLE_APM === '1') {
  // Im disabling TS Linting error because im using CommonJS.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('elastic-apm-node').start({
    // `serviceName` is just the identifier.
    serviceName: 'tradenexus-order',
    serverUrl: process.env.ELASTIC_APM_SERVER_URL,
    secretToken: process.env.ELASTIC_APM_SECRET_TOKEN,
    // This is just an environment i want to use to identify and this is also
    // for indentification.
    environment: process.env.NODE_ENV,
    // This is a boolean specifying if the agent should be active or not.
    /* active: process.env.NODE_ENV !== 'development' */
    // If i dont want to enable APM in my local machine during development,
    // I can just set the `.env` variable `ENABLE_APM` to `0`.
    active: true,
    // I want to be able to capture all requests because by default, the
    // HTTP body of incoming requests is not recorded and sent to the APM
    // server.
    // `off`, `errors`, `transactions`, and `all` are possible options.
    // If I set `all`, its going to capture all the incoming HTTP request body.
    // But if recorded body is larger than 2 KiB, its going to truncate it.
    // So im using `all`.
    captureBody: 'all',
    // A boolean specifying if the agent should monitor for aborted TCP
    // connections with un-ended HTTP requests. So its for TCP connections like
    // if i have any connections that may throw an error when the request was
    // sent, then i want to capture them as well.
    errorOnAbortedRequests: true,
    // This stack trace is stored along with the error message when the error
    // is sent to the APM Server. The stack trace points to the place where
    // the Error object was instantiated.
    captureErrorLogStackTraces: 'always'
  });
}

class Config {
  public DATABASE_URL: string | undefined;
  public NODE_ENV: string | undefined;
  public RABBITMQ_ENDPOINT: string | undefined;
  public JWT_TOKEN: string | undefined;
  public CLOUD_NAME: string | undefined;
  public CLOUD_API_KEY: string | undefined;
  public CLOUD_API_SECRET: string | undefined;
  public GATEWAY_JWT_TOKEN: string | undefined;
  public API_GATEWAY_URL: string | undefined;
  public CLIENT_URL: string | undefined;
  public STRIPE_API_KEY: string | undefined;
  public ELASTIC_SEARCH_URL: string | undefined;

  constructor() {
    this.DATABASE_URL = process.env.DATABASE_URL || '';
    this.NODE_ENV = process.env.NODE_ENV || '';
    this.RABBITMQ_ENDPOINT = process.env.RABBITMQ_ENDPOINT || '';
    this.JWT_TOKEN = process.env.JWT_TOKEN || '';
    this.CLOUD_NAME = process.env.CLOUD_NAME || '';
    this.CLOUD_API_KEY = process.env.CLOUD_API_KEY || '';
    this.CLOUD_API_SECRET = process.env.CLOUD_API_SECRET || '';
    this.GATEWAY_JWT_TOKEN = process.env.GATEWAY_JWT_TOKEN || '';
    this.API_GATEWAY_URL = process.env.API_GATEWAY_URL || '';
    this.CLIENT_URL = process.env.CLIENT_URL || '';
    this.STRIPE_API_KEY = process.env.STRIPE_API_KEY || '';
    this.ELASTIC_SEARCH_URL = process.env.ELASTIC_SEARCH_URL || '';
  }

  public cloudinaryConfig(): void {
    cloudinary.v2.config({
      cloud_name: this.CLOUD_NAME,
      api_key: this.CLOUD_API_KEY,
      api_secret: this.CLOUD_API_SECRET
    });
  }
}

export const config: Config = new Config();
