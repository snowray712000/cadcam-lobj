export interface LobjData {
  vertices:  Float32Array;
  normals:   Float32Array | null;
  colors:    Float32Array | null;
  labels:    Int8Array | null;
  tex2d:     Float32Array | null;
  triangles: Uint32Array;
  texId:     Uint32Array | null;
}

export declare function parseLobjBinary(buffer: ArrayBuffer): LobjData;
export declare function isValidLobj(buffer: ArrayBuffer): boolean;
