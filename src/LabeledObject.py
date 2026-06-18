from __future__ import annotations # Menu 使用 Menu ，當然，也可以直接使用 Self
# -*- coding: utf-8 -*-
"""
Created on 2023/8/9
@author: User
"""

#%% 讀  .lobj 檔
import numpy as np
import numpy.typing as npt
from typing import List, Union, Tuple, Optional
import typing as t

TpLabelOfVertices = npt.NDArray[np.int8]
TpVertices = npt.NDArray[np.float32]
TpTriangles = npt.NDArray[np.int32]
TpIndicesOfResample = npt.NDArray[np.int32] 
""" 使用 toMesh3 從 lobj 建立的 mesh，頂點數與原lobj不同時(通常是變少，因經過SOP)，這時候新的頂點會是 lobj[0][indices]，若 labels 存在，也是一樣。"""

# TpLabeledObject = t.Tuple[
#     TpVertices, # vertexs (:,3)
#     t.Optional[npt.NDArray[np.float32]], # normals (:,3)
#     t.Optional[npt.NDArray[np.float32]], # colors (:,3)
#     t.Optional[TpLabelOfVertices], # labels (:,)
#     t.Optional[npt.NDArray[np.float32]], # tex2D (:,2)
#     TpTriangles, # triangles (:,3)
#     t.Optional[npt.NDArray[np.int32]], # texId (:,3) 
# ]

TpLObj: t.TypeAlias = t.Tuple[
              npt.NDArray[np.float32], # vertexs (:,3)
              t.Optional[npt.NDArray[np.float32]], # normals (:,3)
              t.Optional[npt.NDArray[np.float32]], # colors (:,3)
              t.Optional[npt.NDArray[np.int8]], # labels (3)
              t.Optional[npt.NDArray[np.float32]], # tex2D (:,2)
              npt.NDArray[np.int32], # triangles (:,3)
              t.Optional[npt.NDArray[np.int32]], # texId (:,3)
            ]
"""
- [0] vertices, Nx3 ... 必要
- [1] normals, Nx3
- [2] colors, Nx3
- [3] labels, N ... int8 ... 可能會有
- [4] tex2d, Mx2 
- [5] triangles, Mx3 ... 必要
- [6] texId, Mx3
"""

def toLobjTupleVTL(vertices, triangles, labels=None):
    """ 太常用了，所以寫成函數 V:vertices, T:triangles, L:labels """
    return (vertices, None, None, labels, None, triangles, None)

class LabeledObject:
  """vertexs, normals, colors, vertex_labels, tex2d, triangles, texId
  """
  _s: LabeledObject = None
  
  def __new__(cls, *args, **kwargs):
      if cls._s is None:
          cls._s = super().__new__(cls)
      return cls._s
  def __init__(self):
    if hasattr(self, 'isInit'):
      return
    self.isInit = True
  def read_from_bytes(self, data: bytes) -> TpLObj:
      """ 當處理 server 時，不一定會存在 path 中，而是在記憶體中時，就需要這個 """
      offset = 0
      counts = np.frombuffer(data, dtype=np.int32, count=7, offset=offset)
      offset += 28

      if counts[0] == 0 or counts[5] == 0:
          raise Exception('assert False')

      vertexs, normals, colors, vertex_labels, tex2d, triangles, texId = None, None, None, None, None, None, None

      def _rd(dtype, n):
          nonlocal offset
          arr = np.frombuffer(data, dtype=dtype, count=n, offset=offset).copy()
          offset += n * np.dtype(dtype).itemsize
          return arr

      vertexs                     = _rd(np.float32, counts[0] * 3).reshape(-1, 3)
      if counts[1]: normals       = _rd(np.float32, counts[1] * 3).reshape(-1, 3)
      if counts[2]: colors        = _rd(np.float32, counts[2] * 3).reshape(-1, 3)
      if counts[3]: vertex_labels = _rd(np.int8,    counts[3])
      if counts[4]: tex2d         = _rd(np.float32, counts[4] * 3).reshape(-1, 3)
      triangles                   = _rd(np.uint32,  counts[5] * 3).reshape(-1, 3)
      if counts[6]: texId         = _rd(np.uint32,  counts[6] * 3).reshape(-1, 3)

      cntv = len(vertexs)
      cntt = len(triangles)
      assert normals       is None or len(normals)       == cntv
      assert colors        is None or len(colors)        == cntv
      assert vertex_labels is None or len(vertex_labels) == cntv
      assert texId         is None or len(texId)         == cntt

      return vertexs, normals, colors, vertex_labels, tex2d, triangles, texId

  def read(self, path: str) -> TpLObj:
      ''' [0] vertexs [3] labels [5] triangles 最可能用到 '''
      with open(path, 'rb') as file:
          return self.read_from_bytes(file.read())
  def save_to_bytes(self, vertexs: npt.NDArray[np.float32],
                    normals: Optional[npt.NDArray[np.float32]],
                    colors: Optional[npt.NDArray[np.float32]],
                    vertex_labels: Optional[npt.NDArray[np.int8]],
                    tex2d: Optional[npt.NDArray[np.float32]],
                    triangles: npt.NDArray[np.int32],
                    texId: Optional[npt.NDArray[np.int32]]) -> bytes:
      """ save .lobj to bytes 當處理 server 時，會直接寫在記憶體中，而非檔案中 """
      cntv = len(vertexs)
      cntt = len(triangles)
      assert normals       is None or len(normals)       == cntv
      assert colors        is None or len(colors)        == cntv
      assert vertex_labels is None or len(vertex_labels) == cntv
      assert texId         is None or len(texId)         == cntt

      counts = [cntv,
                0 if normals       is None else cntv,
                0 if colors        is None else cntv,
                0 if vertex_labels is None else cntv,
                0 if tex2d         is None else len(tex2d),
                cntt,
                0 if texId         is None else cntt,
                ]

      chunks = [np.array(counts, dtype=np.int32).tobytes(),
                vertexs.astype(np.float32, copy=False).tobytes()]
      if counts[1]: chunks.append(normals.astype(np.float32, copy=False).tobytes())
      if counts[2]: chunks.append(colors.astype(np.float32, copy=False).tobytes())
      if counts[3]: chunks.append(vertex_labels.astype(np.int8, copy=False).tobytes())
      if counts[4]: chunks.append(tex2d.astype(np.float32, copy=False).tobytes())
      chunks.append(triangles.astype(np.int32, copy=False).tobytes())
      if counts[6]: chunks.append(texId.astype(np.int32, copy=False).tobytes())

      return b''.join(chunks)

  def save(self, path: str,
           vertexs: npt.NDArray[np.float32],
           normals: Optional[npt.NDArray[np.float32]],
           colors: Optional[npt.NDArray[np.float32]],
           vertex_labels: Optional[npt.NDArray[np.int8]],
           tex2d: Optional[npt.NDArray[np.float32]],
           triangles: npt.NDArray[np.int32],
           texId: Optional[npt.NDArray[np.int32]]) -> None:
      ''' save .lobj 檔
      labels is int8, -1: no labels, 0: label0, 1: label1
      triangles is int32, 0-based
      vertex is float32, x y z '''
      with open(path, 'wb') as file:
          file.write(self.save_to_bytes(vertexs, normals, colors, vertex_labels, tex2d, triangles, texId))
      
  def saveVsLsTris(self, path: str,
                   vertexs: npt.NDArray[np.float32],
                   labels: Optional[npt.NDArray[np.int8]],
                   triangles: npt.NDArray[np.int32]):
    ''' alias save(path, vertex, None, None, labels, None, triangles, None)
    labels is int8, -1: no labels, 0: label0, 1: label1
    triangles is int32, 0-based
    vertex is float32, x y z '''
    self.save(path,vertexs, None, None, labels, None, triangles, None)

if __name__ == '__main__':
    # sample 1
    lobj = LabeledObject().read('./test.lobj')
    vertices = lobj[0] # numpy array ... (N,3) float32
    triangles = lobj[5] # numpy array ... (M,3) int32
    labels = lobj[3] # numpy array ... (N,) int8
    
    # r1 = LabeledObject().read(path = './../crownsegmentation_230802/result/re_140_lower_farthest_505.lobj')    
    # LabeledObject().saveVsLsTris('./../crownsegmentation_230802/result/re_140_lower_farthest_505_b.lobj', r1[0], r1[3], r1[5])
    # r2 = LabeledObject().read(path = './../crownsegmentation_230802/result/re_140_lower_farthest_505_b.lobj')
    pass