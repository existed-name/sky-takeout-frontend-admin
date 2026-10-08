// 布局子组件的汇总导出。
//
// 说明：src/layout/index.vue 的脚本块（逐字还原）中写的是
//   `import { AppMain, Navbar, Sidebar } from './components'`
// 因此 ./components 必须是一个可解析的模块（目录下的 index.ts）。
// 该文件只做转出，内容由导入语句与目录结构唯一确定。

export { default as AppMain } from './AppMain.vue'
export { default as Navbar } from './Navbar/index.vue'
export { default as Sidebar } from './Sidebar/index.vue'
