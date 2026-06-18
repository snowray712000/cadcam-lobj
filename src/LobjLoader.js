import { parseLobj } from './parseLobj.js';
import { parseLobjBinary, isBinaryLobj } from './parseLobjBinary.js';

export class LobjLoader {
  /**
   * Load a .lobj file from URL and return parsed data.
   * Automatically detects binary vs text format.
   * @param {string} url
   * @returns {Promise<object>}
   */
  async load(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to load ${url}: ${resp.status}`);
    const buf = await resp.arrayBuffer();
    if (isBinaryLobj(buf)) return parseLobjBinary(buf);
    const text = new TextDecoder().decode(buf);
    return parseLobj(text);
  }
}
