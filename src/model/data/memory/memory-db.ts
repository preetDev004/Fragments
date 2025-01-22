//* NOTE: Typescript enforces type validation so I don't have to do it manually!

class MemoryDB {
  private db: Record<string, Record<string, unknown>>;

  constructor() {
    this.db = {};
  }

  /**
   * Gets a value for the given primaryKey and secondaryKey
   * @param {string} primaryKey
   * @param {string} secondaryKey
   * @returns {Promise<unknown>}
   */
  get(primaryKey: string, secondaryKey: string): Promise<unknown> {
    const value = this.db[primaryKey]?.[secondaryKey];
    return Promise.resolve(value);
  }

  /**
   * Puts a value into the given primaryKey and secondaryKey
   * @param {string} primaryKey
   * @param {string} secondaryKey
   * @param {unknown} value
   * @returns {Promise<void>}
   */
  put(primaryKey: string, secondaryKey: string, value: unknown): Promise<void> {
    if (!this.db[primaryKey]) {
      this.db[primaryKey] = {};
    }

    this.db[primaryKey][secondaryKey] = value;
    return Promise.resolve();
  }

  /**
   * Queries the list of values (i.e., secondaryKeys) for the given primaryKey.
   * Always returns an Array, even if no items are found.
   * @param {string} primaryKey
   * @returns {Promise<unknown[]>}
   */
  query(primaryKey: string): Promise<unknown[]> {
    const values = this.db[primaryKey] ? Object.values(this.db[primaryKey]) : [];
    return Promise.resolve(values);
  }

  /**
   * Deletes the value with the given primaryKey and secondaryKey
   * @param {string} primaryKey
   * @param {string} secondaryKey
   * @returns {Promise<void>}
   */
  async del(primaryKey: string, secondaryKey: string): Promise<void> {
    if (!(await this.get(primaryKey, secondaryKey))) {
      throw new Error(
        `missing entry for primaryKey=${primaryKey} and secondaryKey=${secondaryKey}`
      );
    }

    delete this.db[primaryKey][secondaryKey];
    return Promise.resolve();
  }
}

export default MemoryDB;
