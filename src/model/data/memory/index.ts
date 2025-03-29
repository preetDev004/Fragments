import Fragment from '../../fragment';
import MemoryDB from './memory-db';

// Create two in-memory databases: one for fragment metadata and the other for raw data
const data = new MemoryDB();
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

// Write a fragment's data buffer to memory db. Returns a Promise
export function writeFragmentData(ownerId: string, id: string, buffer: unknown) {
  return data.put(ownerId, id, buffer);
}

// Read a fragment's data from memory db. Returns a Promise
export function readFragmentData(ownerId: string, id: string) {
  return data.get(ownerId, id);
}

// Get a list of fragment ids/objects for the given user from memory db. Returns a Promise
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

// Delete a fragment's metadata and data from memory db. Returns a Promise
export function deleteFragment(ownerId: string, id: string) {
  return Promise.all([
    // Delete metadata
    metadata.del(ownerId, id),
    // Delete data
    data.del(ownerId, id),
  ]);
}
// Delete fragments metadata and data from memory db. Returns a Promise
// Delete multiple fragments' metadata and data from memory db. Returns a Promise
export function deleteFragments(ownerId: string, ids: string[]) {
  return Promise.all(
    ids.map((id) => 
      Promise.all([
        metadata.del(ownerId, id),
        data.del(ownerId, id),
      ])
    )
  );
}
