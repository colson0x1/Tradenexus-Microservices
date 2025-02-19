import { Client } from '@elastic/elasticsearch';
import { config } from '@gig/config';
import { ISellerGig, winstonLogger } from '@colson0x1/tradenexus-shared';
import { Logger } from 'winston';
import { ClusterHealthResponse, GetResponse } from '@elastic/elasticsearch/lib/api/types';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'gigElasticSearchServer', 'debug');

const elasticSearchClient = new Client({
  node: `${config.ELASTIC_SEARCH_URL}`
});

// `checkConnection` will be used to check the health status of our
// Elasticsearch Node because we're running a single Node Cluster.
const checkConnection = async (): Promise<void> => {
  let isConnected = false;
  while (!isConnected) {
    try {
      const health: ClusterHealthResponse = await elasticSearchClient.cluster.health({});
      log.info(`GigService Elasticsearch health status - ${health.status}`);
      isConnected = true;
    } catch (error) {
      log.error('Connection to Elasticsearch failed. Retrying...');
      log.log('error', 'GigService checkConnection() method:', error);
    }
  }
};

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
      // i.e The reason for this `refresh()` is so that after the index has been
      // created, every document that is added can be searched, can be obtained
      // using the search query.
      await elasticSearchClient.indices.refresh({ index: indexName });
      log.info(`Created index ${indexName}`);
    }
  } catch (error) {
    log.error(`An error occurred while creating the index ${indexName}`);
    log.log('error', 'GigService createIndex() method:', error);
  }
}

// Method to get a document from the index
// This method getIndexedData is going to return a promise of type `ISellerGig`
// because documents that im going to add will be of type `ISellerGig`.
const getIndexedData = async (index: string, itemId: string): Promise<ISellerGig> => {
  try {
    const result: GetResponse = await elasticSearchClient.get({ index, id: itemId });
    // The data we need is always in the `_source`
    return result._source as ISellerGig;
  } catch (error) {
    log.log('error', 'GigService elasticsearch getIndexedData() method error:', error);
    // This needs to return something so here i wil just return an empty curly
    // braces and i'll cast it as a `ISellerGig`.
    return {} as ISellerGig;
  }
};

const addDataToIndex = async (index: string, itemId: string, gigDocument: unknown): Promise<void> => {
  try {
    await elasticSearchClient.index({
      index,
      id: itemId,
      // document we want to add. The key name is always `document` and the
      // value is whatever value we want to add like an object
      document: gigDocument
    });
  } catch (error) {
    log.log('error', 'GigService elasticsearch addDataToIndex() method error:', error);
    // Here its not going to return anything
  }
};

export { checkConnection, createIndex, getIndexedData, addDataToIndex };
