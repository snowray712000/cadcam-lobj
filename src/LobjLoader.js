import { parseLobj } from './parseLobj.js';

export class LobjLoader {
  /**
   * Load a .lobj file from URL and return parsed data.
   * @param {string} url
   * @returns {Promise<{vertices: number[][], groups: Array}>}
   */
  async load(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to load ${url}: ${resp.status}`);
    const text = await resp.text();
    return parseLobj(text);
  }
}
