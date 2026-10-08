// svg-icon 图标注册入口（自写）。
//
// 说明（Final Impl Plan §4 / §5.2）：
//   `src/main.ts` 中有 `import '@/icons/components'`，但 source map 里没有这个文件的条目
//   —— 它被 webpack 的 scope hoisting 合并掉了。因此本文件为**自写**，作用仅是按顺序
//   引入 8 个由 vue-svgicon 生成的图标注册文件（每个文件内部调用 `icon.register(...)`）。
//   8 个图标文件本身是逐字还原产物，不得修改。
import './dashboard'
import './employee'
import './hamburger'
import './inform'
import './main'
import './pay'
import './shop'
import './vip'
