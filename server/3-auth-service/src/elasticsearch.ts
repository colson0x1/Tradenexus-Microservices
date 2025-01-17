import { Client } from '@elastic/elasticsearch';
import { config } from '@auth/config';
import { winstonLogger } from '@colson0x1/tradenexus-shared';
import { Logger } from 'winston';
import { ClusterHealthResponse } from '@elastic/elasticsearch/lib/api/types';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authElasticSearchServer', 'debug');

// This will be used outside of this file in this service.
const elasticSearchClient = new Client({
  node: `${config.ELASTIC_SEARCH_URL}`
});

// `checkConnection` will be used to check the health status of our
// Elasticsearch Node because we're running a single Node Cluster.
async function checkConnection(): Promise<void> {
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

// Method to check if an index exists or not. Elasticsearch will throw an
// error if index already exists
async function checkIfIndexExist(indexName: string): Promise<boolean> {
  const result: boolean = await elasticSearchClient.indices.exists({ index: indexName });
  return result;
}

// Method to create an actual index
async function createIndex(indexName: string): Promise<void> {
  try {
    const result: boolean = await checkIfIndexExist(indexName);
    if (result) {
      log.info(`Index "${indexName}" already exist.`);
    } else {
      // Create the index
      await elasticSearchClient.indices.create({ index: indexName });
      // What this .refresh() does is, just to allow once it is created i.e
      // once index is created and then any document that is added, that
      // document should be available for search.
      // So once this index is created, we just call the .refresh() and then
      // any document that is added to the index will be available for search.
      await elasticSearchClient.indices.refresh({ index: indexName });
      log.info(`Created index ${indexName}`);
    }
  } catch (error) {
    log.error(`An error occurred while creating the index ${indexName}`);
    log.log('error', 'AuthService createIndex() method:', error);
  }
}

export { elasticSearchClient, checkConnection, createIndex };
