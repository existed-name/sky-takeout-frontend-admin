/**
 * PostCSS 配置（Vue CLI 3 体系）
 *
 * 背景订正（见 04-plan-final-restore-source.md §15.14 第 3 条）：
 * 原以为「CLI 3 自带 autoprefixer」，实测不成立。@vue/cli-service@3.12.1 的
 * lib/config/css.js 只在「工程根存在 postcss 配置文件」时才挂 postcss-loader，
 * 且自身不注入任何插件；本文件此前的空导出（module.exports = {}）会让
 * PostCSS 插件链为空，从而完全关掉厂商前缀。对照产物可证：
 *   display:-webkit-box   原产物 app.css 52 / 空配置 13
 *   -webkit-animation:    原产物 app.css 35 / 空配置 0
 *
 * 因此这里显式启用 autoprefixer，浏览器目标取自 package.json 的 browserslist
 * （CLI 3 默认值："> 1%", "last 2 versions"）。
 *
 * 写成 CommonJS 的 module.exports 对象形式，保证被 postcss-loader /
 * postcss-load-config 在子进程中 require 时能正确加载。
 */
module.exports = {
  plugins: {
    autoprefixer: {}
  }
};
