import { parseLobjBinary, isValidLobj } from './parseLobjBinary.js';

export class LobjLoader {
  /**
   * Load a .lobj file from URL and return parsed data.
   * 
   * fetch url，會先 .status 判斷，再取它的 arrayBuffer
   * @param {string} url
   * @returns {Promise<object>}
   */
  async load(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to load ${url}: ${resp.status}`);
    const buf = await resp.arrayBuffer();
    if (isValidLobj(buf)) return parseLobjBinary(buf);

    throw new Error(`Invalid .lobj file: ${url}`);
  }
}
