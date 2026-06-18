# .lobj 格式設計文件

## 前言

AI 時代的到來，使得 3D 網格模型的語意標註需求大幅增加——
無論是牙齒分割、器官辨識、還是場景理解，都需要在網格的每個頂點上記錄分類標籤（label）。

## 問題

主流的 3D 檔案格式均缺乏原生的標籤欄位：

| 格式 | 問題 |
|------|------|
| `.stl` | 頂點大量重複，無法對應標籤 |
| `.obj` | 有獨立頂點清單，但無標籤欄位 |
| `.ply` | 可擴充，但屬性定義繁瑣，互通性差 |

## 目標

- **可標記性**：每個頂點（vertex）可攜帶一個整數標籤
- **支援 Triangle Mesh**：以三角面片為基礎，而非點雲
- **高效率**：二進制格式，非 ASCII，讀寫速度快、體積小

## 設計方法

### 為何選 `.obj` 作為基礎？

`.obj` 格式天生將頂點與面分開儲存：

```
v x y z      ← 頂點清單（每行一個）
f i j k      ← 面清單（引用頂點索引）
```

只需在頂點清單旁附加一個**等長的標籤陣列**，即可完整對應每個頂點的語意，無需改動面的結構。

### 二進制格式（Binary）

捨棄 ASCII 文字改用二進制，原因：

- 解析速度快（直接記憶體映射）
- 檔案體積小（float32 比文字數字緊湊）

### 標籤型別：`int8`

- 標籤編號通常在 255 以內，`int8` 已足夠
- 選用**有號數** `int8`（而非 `uint8`），是為了保留 `-1` 作為「未標記（unlabeled）」的慣例值

## 二進制檔案結構

```
┌─────────────────────────────────┐
│  Header  (28 bytes = 7 × int32) │
├───┬─────────────────────────────┤
│ 0 │ cntv    頂點數（必要，> 0） │
│ 1 │ normals 法向量數（0 或 cntv）│
│ 2 │ colors  顏色數  （0 或 cntv）│
│ 3 │ labels  標籤數  （0 或 cntv）│
│ 4 │ tex2d   紋理座標數           │
│ 5 │ cntt    三角形數（必要，> 0）│
│ 6 │ texId   紋理ID數（0 或 cntt）│
├───┴─────────────────────────────┤
│  Data Chunks（依 Header 順序）  │
│  vertices  float32  cntv × 3   │
│  normals   float32  若 > 0     │
│  colors    float32  若 > 0     │
│  labels    int8     若 > 0     │
│  tex2d     float32  若 > 0     │
│  triangles uint32   cntt × 3   │
│  texId     uint32   若 > 0     │
└─────────────────────────────────┘
```

> **實務上最常使用的三個欄位為 `vertices`、`triangles`、`labels`，其餘均為選填。**

## 結果與反思

`.lobj` 最初設計時以盡量相容原始 `.obj` 為目標，保留了法向量、顏色、紋理座標等欄位。

實際使用後發現：**絕大多數場景只需要 vertices、triangles、labels 三個欄位**，其他欄位的使用率極低。

這反映了一個常見的設計取捨——**通用性 vs. 精簡性**。未來若有精簡需求，可考慮定義一個只含這三個必要欄位的「精簡模式」子集。

## 使用範例

### Python

```python
from Easy import LabeledObject

# 讀取
lobj = LabeledObject().read('model.lobj')
vertices  = lobj[0]  # np.ndarray, shape (N, 3), float32
triangles = lobj[5]  # np.ndarray, shape (M, 3), int32
labels    = lobj[3]  # np.ndarray, shape (N,),   int8  or None

# 儲存（僅 vertices / labels / triangles）
LabeledObject().saveVsLsTris('out.lobj', vertices, labels, triangles)
```

### JavaScript

```js
import { parseLobjBinary, isBinaryLobj } from 'cadcam-lobj';

const buf = await file.arrayBuffer();
if (isBinaryLobj(buf)) {
  const { vertices, triangles, labels } = parseLobjBinary(buf);
  // vertices  Float32Array, length = N × 3
  // triangles Uint32Array,  length = M × 3
  // labels    Int8Array,    length = N  (or null)
}
```
