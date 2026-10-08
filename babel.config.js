/**
 * Babel 配置（Vue CLI 3 体系）
 *
 * 预置名用 `@vue/app`：这是 @vue/cli-plugin-babel@3.12.1 的 generator 生成的官方写法，
 * Babel 会把 scoped 名归一化为 @vue/babel-preset-app（= 本工程实际安装的 3.12.1）。
 * 注意 `@vue/cli-plugin-babel/preset` 是 Vue CLI 4+ 才有的入口，3.12.1 包内不存在该文件，
 * 使用它会在开发/构建时报「Could not resolve "@vue/cli-plugin-babel/preset"」。
 * 该 preset 内部使用 core-js 2（与本工程钉的 core-js 2.6.10 一致）。
 */
module.exports = {
  presets: ['@vue/app']
};
