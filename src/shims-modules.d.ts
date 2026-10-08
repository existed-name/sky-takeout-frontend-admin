// 非 TypeScript 模块的类型声明。
//
// 背景：逐字还原的脚本块里有两类导入，TypeScript 无法自行解析：
//   1. `import variables from '@/styles/_variables.scss'`（样式模块，默认导入）；
//   2. `import path from 'path'`（Node 内置模块）。
//
// 说明：
//   - 样式声明是 Vue 2 + TypeScript 工程的常规补充（.scss / .css 不是 TS 模块）；
//   - `path` 的声明是因为本工程的 tsconfig 限定 `types: ["webpack-env"]`（见 tsconfig 说明），
//     未引入 @types/node，故这里给出最小声明。运行时由 webpack 4 的 node-core
//     自动 polyfill（path → path-browserify）提供实现，不受此声明影响。

declare module '*.scss' {
  const content: any
  export default content
}

declare module '*.css' {
  const content: any
  export default content
}

declare module 'path' {
  const path: any
  export default path
}
