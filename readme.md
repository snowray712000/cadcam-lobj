### 目標

- 一個載入 .lobj (自訂的 labeled obj file) 相關的 package
- 將會有 github 中，有 demo 的 html
- [.lobj design html(github only)](./doc/lobj-design.html) 會有 lobj 的設計說明
- [.demo html (github only)](./demo/index.html) 會有 demo 的說明

### usage

```js
import { isValidLobj, parseLobjBinary } from '@cadcam/lobj';
async function loadFile(file) {
    try {
        const buf = await file.arrayBuffer();
        if (isValidLobj(buf)) {
            const lobjdata = parseLobjBinary(buf);
        }
    } catch (e) {
        alert('解析失敗: ' + e.message);
    }
}

// 拖曳進入 drag-drop method
function add_event_drop_lobj(container) {
    container.addEventListener('dragover', e => e.preventDefault());
    container.addEventListener('drop', e => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) loadFile(file);
    });
}

// input file method
document.getElementById('fileInput').addEventListener('change', e => {
         const file = e.target.files[0];
         if (file) loadFile(file);
});

// 其他載入方式，例如 fetch 從伺服器載入
async function fetch_from_url(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to load ${url}: ${resp.status}`);
    const buf = await resp.arrayBuffer();
    if (isValidLobj(buf)) return parseLobjBinary(buf);

    throw new Error(`Invalid .lobj file: ${url}`);
}
```