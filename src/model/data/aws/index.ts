import MemoryDB from '../memory/memory-db';
import Fragment from '../../fragment';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import s3Client from './s3Client';
import logger from '../../../logger';
import { Readable } from 'stream';
import { Response } from 'express';

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

// Create in-memory database one for fragment metadata
const metadata = new MemoryDB();

// Write a fragment's metadata to memory db. Returns a Promise<void>
export function writeFragment(fragment: Fragment) {
  // Simulate db/network serialization of the value, storing only JSON representation.
  // This is important because it's how things will work later with AWS data stores.
  const serialized = JSON.stringify(fragment);
  return metadata.put(fragment.ownerId, fragment.id, serialized);
}

// Read a fragment's metadata from memory db. Returns a Promise<Object>
export async function readFragment(ownerId: string, id: string) {
  // NOTE: this data will be raw JSON, we need to turn it back into an Object.
  // You'll need to take care of converting this back into a Fragment instance
  // higher up in the callstack.
  const serialized = await metadata.get(ownerId, id);
  return typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
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
export async function listFragments(ownerId: string, expand = false) {
  const fragments = await metadata.query(ownerId);
  // If we don't get anything back, or are supposed to give expanded fragments, return
  // Ensure fragments are JSON objects
  const parsedFragments: Fragment[] = fragments.map((fragment) =>
    typeof fragment === 'string' ? JSON.parse(fragment) : fragment
  );
  if (expand || !fragments) {
    return parsedFragments;
  }
  // Otherwise, map to only send back the ids
  return parsedFragments.map((fragment) => fragment.id);
}

// Delete a fragment's metadata and data from AWS S3. Returns a Promise
export async function deleteFragment(ownerId: string, id: string) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME as string,
    Key: `${ownerId}/${id}`,
  };
  try {
    const command = new DeleteObjectCommand(params);
    await metadata.del(ownerId, id);
    await s3Client.send(command);
  } catch (err) {
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error streaming fragment data from S3');
    throw new Error('unable to read fragment data');
  }
}
