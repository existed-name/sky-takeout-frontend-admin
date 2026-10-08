// JSX 的类型声明（Vue CLI 3 官方 TypeScript 脚手架生成的标准声明，逐字沿用）。
// 作用：开启 tsconfig 的 `jsx: preserve` 后，为 JSX 元素提供类型定义。

import Vue, { VNode } from 'vue'

declare global {
  namespace JSX {
    // tslint:disable no-empty-interface
    interface Element extends VNode {}
    // tslint:disable no-empty-interface
    interface ElementClass extends Vue {}
    interface IntrinsicElements {
      [elem: string]: any
    }
  }
}
