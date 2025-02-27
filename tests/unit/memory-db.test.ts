import MemoryDB from '../../src/model/data/memory/memory-db';

describe('memory-db', () => {
  let db: MemoryDB;

  // Each test will get its own, empty database instance
  beforeEach(() => {
    db = new MemoryDB();
  });

  test('put() returns nothing', async () => {
    const result = await db.put('a', 'b', {});
    expect(result).toBe(undefined);
  });

  test('get() returns what we put() into the db', async () => {
    const data = { value: 123 };
    await db.put('a', 'b', data);
    const result = await db.get('a', 'b');
    expect(result).toEqual(data);
  });

  test('put() and get() work with Buffers', async () => {
    const data = Buffer.from([1, 2, 3]);
    await db.put('a', 'b', data);
    const result = await db.get('a', 'b');
    expect(result).toEqual(data);
  });

  test('get() with incorrect secondaryKey returns nothing', async () => {
    await db.put('a', 'b', 123);
    const result = await db.get('a', 'c');
    expect(result).toBe(undefined);
  });

  test('query() returns all secondaryKey values', async () => {
    await db.put('a', 'a', { value: 1 });
    await db.put('a', 'b', { value: 2 });
    await db.put('a', 'c', { value: 3 });

    const results = await db.query('a');
    expect(Array.isArray(results)).toBe(true);
    expect(results).toEqual([{ value: 1 }, { value: 2 }, { value: 3 }]);
  });

  test('query() returns empty array', async () => {
    await db.put('b', 'a', { value: 1 });
    await db.put('b', 'b', { value: 2 });
    await db.put('b', 'c', { value: 3 });

    const results = await db.query('a');
    expect(Array.isArray(results)).toBe(true);
    expect(results).toEqual([]);
  });

  test('del() removes value put() into db', async () => {
    await db.put('a', 'a', { value: 1 });
    expect(await db.get('a', 'a')).toEqual({ value: 1 });
    await db.del('a', 'a');
    expect(await db.get('a', 'a')).toBe(undefined);
  });

  test('del() throws if primaryKey and secondaryKey not in db', () => {
    expect(() => db.del('a', 'a')).rejects.toThrow();
  });
});
