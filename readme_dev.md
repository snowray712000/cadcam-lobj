### thinking

- html
  - 基於 three.js, html, css, js, es module, vite
- lobj
  - 將 .py 的 src 給 ai，產生對應的 .js
- 寫 lobj 文件，給使用者
  - [lobj-design.md](doc/lobj-design.md)
- 準備 index.d.ts 與 JsDoc 相關的 type

### 上傳到 github 轉 page 時

- import error
  - 要加 importmap 在 index.html 中

### publish

- npm run build:lib
- npm pack
- npm whoami
- npm login
- npm publish --access public