import {
  deleteFragment,
  listFragments,
  readFragment,
  readFragmentData,
  writeFragment,
  writeFragmentData,
} from '../../src/model/data/memory'; // Update with the correct path to your module

import Fragment from '../../src/model/fragment';

// Wait for a certain number of ms (default 50). Feel free to change this value
// if it isn't long enough for your test runs. Returns a Promise.
// const wait = async (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));

describe('DB operations', () => {
  const testOwnerId = 'test-owner-123';
  const testFragment: Fragment = new Fragment({
    ownerId: testOwnerId,
    type: 'text/plain',
    size: 0,
  });

  describe('writeFragment()', () => {
    it('should write fragment metadata successfully', async () => {
      await expect(writeFragment(testFragment)).resolves.not.toThrow();
    });
  });

  describe('readFragment()', () => {
    it('should read existing fragment metadata', async () => {
      const retrievedFragment = await readFragment(testOwnerId, testFragment.id);

      expect(retrievedFragment).toMatchObject({
        id: testFragment.id,
        ownerId: testOwnerId,
        type: 'text/plain',
      });
    });
    it('should not read fragment metadata for non-existent owner', async () => {
      const retrievedFragment = await readFragment('non-existent-owner', testFragment.id);
      expect(retrievedFragment).toBeUndefined();
    });
  });

  describe('writeFragmentData()', () => {
    it('should write fragment data successfully', async () => {
      const testData = Buffer.from('test data');
      await expect(
        writeFragmentData(testOwnerId, testFragment.id, testData)
      ).resolves.not.toThrow();
    });
  });

  describe('readFragmentData()', () => {
    it('should read written fragment data', async () => {
      const testData = Buffer.from('test data');
      await writeFragmentData(testOwnerId, testFragment.id, testData);

      const retrievedData = await readFragmentData(testOwnerId, testFragment.id);
      expect(retrievedData).toEqual(testData);
    });
    it('should not read fragment data for non-existent owner', async () => {
      const retrievedFragmentData = await readFragmentData('non-existent-owner', testFragment.id);
      expect(retrievedFragmentData).toBeUndefined();
    });
  });

  describe('listFragments()', () => {
    it('should list fragment IDs by default', async () => {
      const fragments = await listFragments(testOwnerId);
      expect(fragments).toContain(testFragment.id);
    });

    it('should list full fragments when expand is true', async () => {
      const fragments = await listFragments(testOwnerId, true);
      expect(fragments[0]).toMatchObject({
        id: testFragment.id,
        ownerId: testOwnerId,
      });
    });

    it('should return empty array for non-existent owner', async () => {
      const fragments = await listFragments('non-existent-owner');
      expect(fragments).toHaveLength(0);
    });
  });

  describe('deleteFragment()', () => {
    it('should delete a fragment successfully', async () => {
      await expect(deleteFragment(testOwnerId, testFragment.id)).resolves.not.toThrow();

      const retrievedFragment = await readFragment(testOwnerId, testFragment.id);
      expect(retrievedFragment).toBeUndefined();
    });

    it('should delete both metadata and data', async () => {
      const testData = Buffer.from('test data');
      await writeFragment(testFragment);
      await writeFragmentData(testOwnerId, testFragment.id, testData);
      await deleteFragment(testOwnerId, testFragment.id);

      const retrievedFragment = await readFragment(testOwnerId, testFragment.id);
      const retrievedData = await readFragmentData(testOwnerId, testFragment.id);

      expect(retrievedFragment).toBeUndefined();
      expect(retrievedData).toBeUndefined();
    });

    it('should throw an error if the fragment does not exist', async () => {
      await expect(deleteFragment(testOwnerId, testFragment.id)).rejects.toThrow();
    });
  });
});
