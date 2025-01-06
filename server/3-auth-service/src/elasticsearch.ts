import { Client } from '@elastic/elasticsearch';
import { config } from '@auth/config';
import { winstonLogger } from '@colson0x1/tradenexus-shared';
import { Logger } from 'winston';
import { ClusterHealthResponse } from '@elastic/elasticsearch/lib/api/types';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authElasticSearchServer', 'debug');

// This will be used outside of this file in this service.
export const elasticSearchClient = new Client({
  node: `${config.ELASTIC_SEARCH_URL}`
});

// `checkConnection` will be used to check the health status of our
// Elasticsearch Node because we're running a single Node Cluster.
export async function checkConnection(): Promise<void> {
  let isConnected = false;
  while (!isConnected) {
    log.info('AuthService connecting to ElasticSearch...');
    try {
      // We want to check the health status if its running. So if its running,
      // once server is started, then this is going to check call this
      // `cluster.health()`. Its going to return an object and inside the object,
      // the response of type ClusterHealthResponse will have `status` property.
      // If its up and running, it will return yellow or green. And in some
      // cases it might return red when server is not running or there's
      // something wrong with the connection.
      // So we just do the check and if its successful, then we set
      // isConnected to true. Otherwise, just log the information in the catch.
      const health: ClusterHealthResponse = await elasticSearchClient.cluster.health({});
      log.info(`AuthService Elasticsearch health status - ${health.status}`);
      isConnected = true;
    } catch (error) {
      log.error('Connection to Elasticsearch failed. Retrying...');
      log.log('error', 'AuthService checkConnection() method:', error);
    }
  }
}
