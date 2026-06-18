/**
 * Parse binary .lobj file (ArrayBuffer) into structured data.
 * Binary format mirrors AppLabelTooth/Easy/LabeledObject.py read_from_bytes().
 *
 * Header: 7 × int32 (28 bytes)
 *   [0] cntv    - vertex count (required, >0)
 *   [1] normals count (0 or cntv)
 *   [2] colors  count (0 or cntv)
 *   [3] labels  count (0 or cntv)
 *   [4] tex2d   count (0 or M)
 *   [5] cntt    - triangle count (required, >0)
 *   [6] texId   count (0 or cntt)
 *
 * @param {ArrayBuffer} buffer
 * @returns {{
 *   vertices: Float32Array,   // (cntv×3)
 *   normals:  Float32Array|null,
 *   colors:   Float32Array|null,
 *   labels:   Int8Array|null,
 *   tex2d:    Float32Array|null,
 *   triangles: Uint32Array,   // (cntt×3)
 *   texId:    Uint32Array|null,
 * }}
 */
export function parseLobjBinary(buffer) {
  const counts = new Int32Array(buffer, 0, 7);
  const cntv = counts[0];
  const cntt = counts[5];

  if (cntv <= 0 || cntt <= 0) throw new Error('Invalid binary .lobj: cntv or cntt is 0');

  let offset = 28;

  function readF32(n) {
    const arr = new Float32Array(buffer, offset, n);
    offset += n * 4;
    return arr;
  }
  function readI8(n) {
    const arr = new Int8Array(buffer, offset, n);
    offset += n;
    return arr;
  }
  function readU32(n) {
    const arr = new Uint32Array(buffer, offset, n);
    offset += n * 4;
    return arr;
  }

  const vertices  = readF32(cntv * 3);
  const normals   = counts[1] ? readF32(counts[1] * 3) : null;
  const colors    = counts[2] ? readF32(counts[2] * 3) : null;
  const labels    = counts[3] ? readI8(counts[3])      : null;
  const tex2d     = counts[4] ? readF32(counts[4] * 3) : null; // py uses ×3 (reshape -1,3)
  const triangles = readU32(cntt * 3);
  const texId     = counts[6] ? readU32(counts[6] * 3) : null;

  return { vertices, normals, colors, labels, tex2d, triangles, texId };
}

/**
 * Detect whether an ArrayBuffer is a binary .lobj file.
 * Reads the header and checks plausibility.
 * @param {ArrayBuffer} buffer
 * @returns {boolean}
 */
export function isBinaryLobj(buffer) {
  if (buffer.byteLength < 28) return false;
  const counts = new Int32Array(buffer, 0, 7);
  const cntv = counts[0], cntt = counts[5];
  if (cntv <= 0 || cntt <= 0) return false;

  // estimate minimum expected size
  const minSize = 28
    + cntv * 3 * 4          // vertices float32
    + (counts[1] ? counts[1] * 3 * 4 : 0)
    + (counts[2] ? counts[2] * 3 * 4 : 0)
    + (counts[3] ? counts[3] : 0)
    + (counts[4] ? counts[4] * 3 * 4 : 0)
    + cntt * 3 * 4           // triangles uint32
    + (counts[6] ? counts[6] * 3 * 4 : 0);

  return buffer.byteLength >= minSize;
}
