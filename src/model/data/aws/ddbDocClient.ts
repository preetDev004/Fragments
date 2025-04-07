import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import logger from '../../../logger';
import { AWSCredentials } from './s3Client';

/**
 * If AWS credentials are configured in the environment, use them.
 * Needed for local testing or connecting to LocalStack/DynamoDB Local.
 * @returns AWSCredentials | undefined
 */
const getCredentials = (): AWSCredentials | undefined => {
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    const credentials: AWSCredentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN,
    };
    logger.debug('Using extra DynamoDB Credentials');
    return credentials;
  }
};

/**
 * If an AWS DynamoDB Endpoint is configured in the environment, use it.
 * @returns string | undefined
 */
const getDynamoDBEndpoint = (): string | undefined => {
  if (process.env.AWS_DYNAMODB_ENDPOINT_URL) {
    logger.debug(
      { endpoint: process.env.AWS_DYNAMODB_ENDPOINT_URL },
      'Using alternate DynamoDB endpoint'
    );
    return process.env.AWS_DYNAMODB_ENDPOINT_URL;
  }
};

// Configure DynamoDB Client Config
const ddbClientConfig: DynamoDBClientConfig = {
  region: process.env.AWS_REGION,
  endpoint: getDynamoDBEndpoint(),
  credentials: getCredentials(),
};

// Create and configure an Amazon DynamoDB client object
const ddbClient = new DynamoDBClient(ddbClientConfig);

// Create DynamoDB Document Client
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: false,
    convertClassInstanceToMap: true, // Required for LocalStack
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

export default ddbDocClient;
