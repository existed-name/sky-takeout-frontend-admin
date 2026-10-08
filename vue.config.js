/**
 * Vue CLI 3 构建配置（由 dist 打包产物反推重建）
 *
 * 本文件的所有取值都以 dist\sky\ 产物的实测证据为准，逐项说明见各注释。
 * 严禁把 outputDir 改成工程根下的 dist（那是只读的还原基准，会被覆盖）。
 */
const path = require('path');

// 品牌名的唯一来源（文件已入库，构建期与运行期都从这里取值）：
//   - 构建期：本文件 require 它，注入 index.html 模板与 manifest.json 的拷贝流程；
//   - 运行期：src/** 通过 `import brand from '@/config/brand.json'` 导入。
// 因此修改 src/config/brand.json 一处，就能让页面标题、PWA 名称、路由标题同步生效。
const brand = require('./src/config/brand.json');

module.exports = {
  // 产物 index.html 内全为相对路径、且 app 里存在 c.p=""、base:"" → 原构建 publicPath 为空串。
  // 同时这决定了 router.ts 里 process.env.BASE_URL 的编译结果为空串。
  publicPath: '',

  // 应用本体输出到 dist-sky/sky，与产物 dist\sky 同层级对齐（dist-sky 相当于新的 nginx 根）。
  // 绝不使用 'dist'，否则会覆盖只读的还原基准。
  outputDir: 'dist-sky/sky',

  // CLI 3 的默认值（lib/options.js）：产物为 css/ js/ img/ media/ fonts/ 平铺。
  assetsDir: '',

  // 原产物把 11.2MB 的 .js.map 一并发布，属源码泄露；重建时关闭。
  productionSourceMap: false,

  // 产物 js 文件名带内容哈希（app.d0aa4eb3.js 等）。
  filenameHashing: true,

  css: {
    // 注意：这里刻意不设置 css.modules，也不把 css.requireModuleExtension 改为 false。
    // 产物里类名 100% 未混淆（.login-box / .tableBar / .orderviewBox …），
    // 一旦启用 css-modules 本地作用域，全部类名会被 hash 化、整站样式崩坏。
    // style-resources-loader 注入出来的 :export → JS 导出是 css-loader 的 ICSS 行为，
    // 不需要、也不得依赖 css.modules。
    loaderOptions: {
      scss: {
        // 使用 dart-sass（sass 1.79.0），禁用 node-sass（避免 Node 原生编译问题）。
        implementation: require('sass')
      }
    }
  },

  chainWebpack: config => {
    // 注入方案采用 §8 Step 2 的主选：链式追加 style-resources-loader。
    // 依据：原产物每个 scss 样式块的 loader 串中都含
    //   style-resources-loader/lib/index.js??ref--8-oneOf-1-4
    // 说明原构建正是用 style-resources-loader 把 src/styles/_variables.scss 前置注入的。
    // 这里给 scss 规则的每个 oneOf（vue-modules / vue / normal-modules / normal）都追加，
    // 从而覆盖 .vue 内联 <style lang="scss"> 与独立 .scss 两种形态。
    // （备选回退写法 css.loaderOptions.scss.data 未采用：它会把 @import 也注入到
    //   _variables.scss 自身，Sidebar/index.vue 直接 import 该文件时存在自引用风险。）
    config.module
      .rule('scss')
      .oneOfs.store.forEach(oneOf => {
        oneOf
          .use('style-resources-loader')
          .loader('style-resources-loader')
          .options({
            patterns: [path.resolve(__dirname, 'src/styles/_variables.scss')],
            injector: 'prepend'
          });
      });

    // 锁定模板编译器的空白语义为 preserve。
    // 依据：产物 render 里的文本节点是未折叠的原始空白（如 _v("\n        OOPS!\n      ")），
    // 默认的 condense 会压成单个空格，破坏文本节点与页面版式。
    config.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => {
        options.compilerOptions = Object.assign({}, options.compilerOptions, {
          whitespace: 'preserve'
        });
        return options;
      });

    // 品牌名注入之一：index.html 模板。
    // public/index.html 是 html-webpack-plugin 的 EJS 模板，Vue CLI 已为其提供插值能力；
    // 这里往插件选项上挂一个 brandName，模板内用
    //   <%= htmlWebpackPlugin.options.brandName %>
    // 取值，从而与 src/config/brand.json 保持同源。
    config.plugin('html').tap(args => {
      args[0].brandName = brand.brandName;
      return args;
    });

    // 品牌名注入之二：public/manifest.json。
    // manifest.json 属于 public/ 下的静态文件、由 copy-webpack-plugin 原样拷贝，走不到 HTML 模板那条链路；
    // 因此给 Vue CLI 自带的拷贝规则追加 transform，把文件里的占位符 __BRAND_NAME__ 替换为品牌名。
    // 未引入新依赖：copy-webpack-plugin 是 Vue CLI 自带依赖。
    config.plugin('copy').tap(args => {
      const patterns = args[0];
      patterns.forEach(pattern => {
        const originalTransform = pattern.transform;
        pattern.transform = (content, absolutePath) => {
          const transformed = originalTransform
            ? originalTransform(content, absolutePath)
            : content;
          // 仅处理 manifest.json，其余文件（含 favicon/图片等二进制）原样返回。
          if (absolutePath && absolutePath.endsWith('manifest.json')) {
            return transformed
              .toString('utf8')
              .replace(/__BRAND_NAME__/g, brand.brandName);
          }
          return transformed;
        };
      });
      return args;
    });
  }

  // devServer.proxy 本阶段刻意不配置：
  // 保持 /api 语义不变（阶段 2 对齐后端接口时再定，见方案 §11）。
};
