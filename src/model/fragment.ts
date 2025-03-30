import { FragError } from './../response';
// Use crypto.randomUUID() to create unique IDs, see:
// https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
import { randomUUID } from 'crypto';
// Use https://www.npmjs.com/package/content-type to create/parse Content-Type headers
import * as contentType from 'content-type';

// Functions for working with fragment metadata/data using our DB
import {
  deleteFragment,
  deleteFragments,
  listFragments,
  readFragment,
  readFragmentData,
  writeFragment,
  writeFragmentData,
} from './data/';

export const validTypes = [
  `text/plain`,
  `text/markdown`,
  `text/html`,
  `text/csv`,
  `application/json`,
  /*
   Currently, only text/plain is supported. Others will be added later.

  `image/png`,
  `image/jpeg`,
  `image/webp`,
  `image/gif`,
  */
];

export interface FragmentData {
  id?: string;
  ownerId: string;
  created?: string;
  updated?: string;
  type: string;
  size?: number;
}

class Fragment {
  readonly id: string;
  readonly ownerId: string;
  readonly created: string;
  updated: string;
  readonly type: string;
  size: number;

  constructor({ id, ownerId, created, updated, type, size = 0 }: FragmentData) {
    if (size < 0) {
      throw new FragError('size cannot be negative', 400);
    }
    if (!Fragment.isSupportedType(type)) {
      throw new FragError(`Unsupported type: ${type}`, 415);
    }
    this.id = id || randomUUID();
    this.ownerId = ownerId;
    this.created = created || new Date().toISOString();
    this.updated = updated || new Date().toISOString();
    this.type = type;
    this.size = size;
  }

  /**
   * Get all fragments (id or full) for the given user
   * @param {string} ownerId user's hashed email
   * @param {boolean} expand whether to expand ids to full fragments
   * @returns Promise<Array<Fragment>>
   */
  static async byUser(ownerId: string, expand = false): Promise<string[] | Fragment[]> {
    const fragments = await listFragments(ownerId, expand);
    return fragments;
  }

  /**
   * Gets a fragment for the user by the given id.
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<Fragment>
   */
  static async byId(ownerId: string, id: string): Promise<Fragment> {
    const fragment = await readFragment(ownerId, id);
    if (!fragment) {
      throw new FragError(`Fragment not found: ${id}`, 404);
    }
    // TIP: make sure you properly re-create a full Fragment instance after getting from db.
    return new Fragment(fragment);
  }

  /**
   * Delete the user's fragment data and metadata for the given id
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<void>
   */
  static delete(ownerId: string, id: string): Promise<[void, void]> {
    return deleteFragment(ownerId, id);
  }

    /**
   * Delete the user's fragment data and metadata for the given id
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<void>
   */
  static deleteMany(ownerId: string, ids: string[]): Promise<[void, void][]> {
    return deleteFragments(ownerId, ids);
  }

  /**
   * Saves the current fragment (metadata) to the database
   * @returns Promise<void>
   */
  async save(): Promise<void> {
    this.updated = new Date().toISOString();
    await writeFragment(this);
  }

  /**
   * Gets the fragment's data from the database
   * @returns Promise<Buffer>
   */
  getData(): Promise<Buffer> {
    return readFragmentData(this.ownerId, this.id) as Promise<Buffer>;
  }

  /**
   * Set's the fragment's data in the database
   * @param {Buffer} data
   * @returns Promise<void>
   */
  async setData(data: Buffer): Promise<void> {
    if (!Buffer.isBuffer(data)) {
      throw new FragError('data must be a Buffer', 400);
    }
    this.size = data.length;
    this.updated = new Date().toISOString();
    await writeFragmentData(this.ownerId, this.id, data);
    // TIP: make sure you update the metadata whenever you change the data, so they match
    await this.save();
  }

  /**
   * Returns the mime type (e.g., without encoding) for the fragment's type:
   * "text/html; charset=utf-8" -> "text/html"
   * @returns {string} fragment's mime type (without encoding)
   */
  get mimeType(): string {
    const { type } = contentType.parse(this.type);
    return type;
  }

  /**
   * Returns true if this fragment is a text/* mime type
   * @returns {boolean} true if fragment's type is text/*
   */
  get isText(): boolean {
    return this.mimeType.startsWith('text/');
  }

  /**
   * Returns the formats into which this fragment type can be converted
   * @returns {Array<string>} list of supported mime types
   */
  get formats(): Array<string> {
    return [this.mimeType];
  }

  /**
   * Returns true if we know how to work with this content type
   * @param {string} value a Content-Type value (e.g., 'text/plain' or 'text/plain: charset=utf-8')
   * @returns {boolean} true if we support this Content-Type (i.e., type/subtype)
   */
  static isSupportedType(value: string): boolean {
    return validTypes.includes(contentType.parse(value).type);
  }
}

export default Fragment;
