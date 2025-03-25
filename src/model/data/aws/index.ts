import { DeleteItemCommand, DeleteItemCommandInput, QueryCommand } from '@aws-sdk/client-dynamodb';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { GetCommand, PutCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { Response } from 'express';
import { Readable } from 'stream';
import logger from '../../../logger';
import Fragment from '../../fragment';
import ddbDocClient from './ddbDocClient';
import s3Client from './s3Client';

// Convert a stream of data into a Buffer, by collecting
// chunks of data until finished, then assembling them together.
const streamToBuffer = (stream: Readable): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    // As the data streams in, we'll collect it into an array.
    const chunks: Buffer[] = [];

    // When there's data, add the chunk to our chunks list
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));

    // When there's an error, reject the Promise
    stream.on('error', (error: Error) => reject(error));

    // When the stream is done, resolve with a new Buffer of our chunks
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

// Write a fragment's metadata to memory db. Returns a Promise<void>
export function writeFragment(fragment: Fragment) {
  // Configure our PUT params, with the name of the table and item (attributes and keys)
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Item: fragment,
  };

  // Create a PUT command to send to DynamoDB
  const command = new PutCommand(params);

  try {
    return ddbDocClient.send(command);
  } catch (err) {
    logger.warn({ err, params, fragment }, 'error writing fragment to DynamoDB');
    throw err;
  }
}

// Read a fragment's metadata from memory db. Returns a Promise<Object>
export async function readFragment(ownerId: string, id: string) {
  // Configure our GET params, with the name of the table and key (partition key + sort key)
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Key: { ownerId, id },
  };

  // Create a GET command to send to DynamoDB
  const command = new GetCommand(params);

  try {
    // Wait for the data to come back from AWS
    const data = await ddbDocClient.send(command);
    // We may or may not get back any data (e.g., no item found for the given key).
    // If we get back an item (fragment), we'll return it.  Otherwise we'll return `undefined`.
    return data?.Item;
  } catch (err) {
    logger.warn({ err, params }, 'error reading fragment from DynamoDB');
    throw err;
  }
}

// Write a fragment's data buffer to AWS S3. Returns a Promise
export async function writeFragmentData(ownerId: string, id: string, data: Buffer): Promise<void> {
  // Create the PUT API params from our details
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME as string,
    // Our key will be a mix of the ownerID and fragment id, written as a path
    Key: `${ownerId}/${id}`,
    Body: data,
  };

  // Create a PUT Object command to send to S3
  const command = new PutObjectCommand(params);

  try {
    // Use our client to send the command
    await s3Client.send(command);
  } catch (err) {
    // If anything goes wrong, log enough info that we can debug
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error uploading fragment data to S3');
    throw new Error('unable to upload fragment data');
  }
}

// Read a fragment's data from memory db. Returns a Promise
export async function readFragmentData(
  ownerId: string,
  id: string,
  res?: Response
): Promise<Readable | Buffer> {
  // Create the GET API params from our details
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME as string,
    // Our key will be a mix of the ownerID and fragment id, written as a path
    Key: `${ownerId}/${id}`,
  };

  // Create a GET Object command to send to S3
  const command = new GetObjectCommand(params);

  try {
    // Get the object from the Amazon S3 bucket. It is returned as a ReadableStream.
    const data = await s3Client.send(command);
    // If a response object is provided, pipe directly to it
    if (res && data.Body) {
      // Type assertion since Body might be undefined
      (data.Body as Readable).pipe(res);
      return data.Body as Readable;
    }

    // Convert the ReadableStream to a Buffer
    // Use non-null assertion as we know Body exists in a successful response
    return streamToBuffer(data.Body as Readable);
  } catch (err) {
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error streaming fragment data from S3');
    throw new Error('unable to read fragment data');
  }
}

// Get a list of fragment ids/objects for the given user from AWS S3. Returns a Promise
export async function listFragments(
  ownerId: string,
  expand: boolean = false
): Promise<string[] | unknown[]> {
  // Configure query parameters
  const params: QueryCommandInput = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    KeyConditionExpression: 'ownerId = :ownerId',
    // Use the proper DynamoDB attribute value format
    ExpressionAttributeValues: {
      ':ownerId': { S: ownerId },
    },
  };

  // Limit to only `id` if we aren't supposed to expand
  if (!expand) {
    params.ProjectionExpression = 'id';
  }

  // Create a QUERY command to send to DynamoDB
  const command = new QueryCommand(params);

  try {
    // Wait for the data to come back from AWS
    const data = await ddbDocClient.send(command);

    // If we haven't expanded to include all attributes, remap this array from
    // [ {"id":"b9e7a264-630f-436d-a785-27f30233faea"}, {"id":"dad25b07-8cd6-498b-9aaf-46d358ea97fe"} ,... ] to
    // [ "b9e7a264-630f-436d-a785-27f30233faea", "dad25b07-8cd6-498b-9aaf-46d358ea97fe", ... ]
    // If we haven't expanded to include all attributes, extract just the id strings
    if (!expand && data?.Items) {
      // Extract the id value from each item object
      return data.Items.map(item => item.id.S);
    } 
    
    // Otherwise return the full items
    return data?.Items || [];
  } catch (err) {
    logger.error({ err, params }, 'error getting all fragments for user from DynamoDB');
    throw err;
  }
}

// Delete a fragment's metadata and data from AWS S3. Returns a Promise
export async function deleteFragment(ownerId: string, id: string) {
  const s3Params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME as string,
    Key: `${ownerId}/${id}`,
  };
  const dynamoDBParams: DeleteItemCommandInput = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Key: {
      ownerId: { S: ownerId },
      id: { S: id },
    },
  };
  try {
    const s3Command = new DeleteObjectCommand(s3Params);
    const dynamoDBCommand = new DeleteItemCommand(dynamoDBParams);

    await s3Client.send(s3Command);
    await ddbDocClient.send(dynamoDBCommand);
  } catch (err) {
    const { Bucket, Key } = s3Params;
    logger.error({ err, Bucket, Key }, 'Error deleteing fragment data from S3 or DynamoDB');
    throw new Error('unable to delete fragment data');
  }
}
