import { Client } from '@elastic/elasticsearch';
import { config } from '@users/config';
import { winstonLogger } from '@colson0x1/tradenexus-shared';
import { Logger } from 'winston';
import { ClusterHealthResponse } from '@elastic/elasticsearch/lib/api/types';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'usersElasticSearchServer', 'debug');

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
      log.info(`UsersService Elasticsearch health status - ${health.status}`);
      isConnected = true;
    } catch (error) {
      log.error('Connection to Elasticsearch failed. Retrying...');
      log.log('error', 'UsersService checkConnection() method:', error);
    }
  }
};

export { checkConnection };
