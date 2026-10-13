# CLAUDE.md — 苍穹外卖 管理端前端

本文件只记录本仓库的**约定、关键事实与坑**；项目介绍请见另行编写的 README。
本工程是从 `dist` 打包产物**还原重建**而来，很多配置以「与基准产物一致」为准，改动前先看清约束。

## 项目结构

```
sky-takeout-frontend-admin/
├── public/                     # 静态模板与资源：index.html（品牌名注入点）、manifest.json、favicon、图片
├── src/
│   ├── api/                    # 接口封装，按业务模块拆分（category / dish / employee / order / setMeal / users）
│   ├── assets/                 # 图片、字体、提示音（reminder.mp3 / preview.mp3）等静态资源
│   ├── components/             # 全局通用组件（Breadcrumb / Hamburger / ImgUpload / InputAutoComplete 等）
│   ├── config/brand.json       # 品牌名唯一来源，构建期注入 title 与 manifest
│   ├── icons/                  # svgicon 图标定义与注册
│   ├── layout/                 # 后台整体布局（侧边栏、顶栏、主区）；Navbar 内含 WebSocket 连接
│   ├── store/                  # Vuex 状态（app / user 两个 module）
│   ├── styles/                 # 全局样式与 SCSS 变量（_variables.scss 由构建期注入）
│   ├── utils/                  # 工具与基础设施：request（axios 实例）、cookies、common、校验等
│   ├── views/                  # 业务页面：dashboard / dish / setmeal / category / employee / orderDetails / statistics / login / 404
│   ├── App.vue
│   ├── main.ts                 # 应用入口
│   ├── router.ts               # 路由表（hash 模式）
│   ├── permission.ts           # 路由守卫（按 cookie 里的 token 判断登录）
│   └── shims-*.d.ts            # 模块 / Vue 单文件组件 / TSX 的类型声明
├── deploy/                     # 云服务器部署物料
│   ├── docker-compose.yml      # 编排 mysql + redis + backend + nginx（只发布 80 端口）
│   ├── Dockerfile.frontend     # 前端镜像：容器内 node 构建 + nginx 托管
│   ├── nginx/default.conf      # 站点配置：静态页 + /api/、/ws/ 反向代理
│   ├── scripts/                # 本机导出库；服务器载镜像 / 导入库 / 重置库
│   ├── .env.example            # 部署侧环境变量模板（真实 .env 不入库）
│   └── README.md               # 部署说明
├── docs/admin-api-mapping.md   # 前端函数 ↔ 后端管理端端点对照表
├── scripts/env-assert.js       # 构建前的 Node 版本断言
├── .env.example                # 源码侧环境变量模板（.env 及其它 .env.* 不入库）
├── .dockerignore               # 镜像构建上下文排除清单
├── .editorconfig / .gitignore / .nvmrc   # 编辑器约定 / 忽略规则 / 基准 Node 16.20.2
├── LICENSE                     # GPL-3.0
├── babel.config.js / postcss.config.js / tsconfig.json
├── vue.config.js               # Vue CLI 配置（端口 8888、别名、品牌名与样式注入等）
├── package.json / package-lock.json      # 依赖与脚本（serve / build / env:check）
└── CLAUDE.md                   # 本文件
```

> `draft/` 为个人草稿、不入库；`node_modules/`、`dist/`、`dist-sky/` 为依赖与构建产物，故不在结构树内。

## 技术栈与版本（`package.json`、`tsconfig.json`）

- Vue 2.6.10、vue-router 3.1.3、vuex 3.1.2、element-ui 2.13.0、axios 0.18.1、js-cookie 2.2.1。
- TypeScript 3.5.3；`@vue/cli-service` 3.12.1（Vue CLI 3 / webpack 4）。
- `tsconfig.json`：`strict: false`、`noImplicitAny: false`、`types: ["webpack-env"]`（**未装 `@types/node`**，故 `src/shims-modules.d.ts` 里手写了 `*.scss` / `*.css` / `path` 的最小声明）。
- 路径别名 `@/* -> src/*`。

## Node 版本与命令（`package.json`、`.nvmrc`、`scripts/env-assert.js`、`vue.config.js`）

- `.nvmrc` = **16.20.2**，即产物一致性的推荐/基准版本。
- 命令只有三个：`npm run env:check`、`npm run serve`、`npm run build`。后两者都会先跑 `env:check`（`scripts/env-assert.js`）。
- `env-assert.js` **只硬拦 Node 主版本 < 14**（Dart Sass 1.79 的下限）；其它版本一律放行、仅提示。主版本 ≥ 18 时，webpack 4 的哈希实现对中文会漂移，**产物文件名哈希与基准不同（文件内容相同、功能一致）**；需要与基准「逐文件名 / 逐字节」比对时必须切回 16.20.2。
- 开发服务器端口固定 **8888**（`vue.config.js` `devServer.port`；默认 8080 会与后端冲突）。
- 构建输出 **`dist-sky/sky`**（`outputDir`）；`publicPath: ''`、`assetsDir: ''`（产物 `css/ js/ img/ fonts/ media/` 平铺）、`productionSourceMap: false`。
- 品牌名注入、`style-resources-loader` 前置注入 `src/styles/_variables.scss`、模板空白语义 `preserve`，都在 `vue.config.js` 的 `chainWebpack` 里，勿随意改动（改动会破坏与基准产物的一致性）。

## 接口约定（`src/utils/request.ts`、`vue.config.js`、`deploy/nginx/default.conf`）

- `baseURL = process.env.VUE_APP_BASE_API = /api`（四个 `.env*` 文件里的取值一致）。
- **接口字面量不带 `/api`、也不带 `/admin`**。`/api` → `/admin` 的映射属于**代理层**：
  - 开发期：`vue.config.js` `devServer.proxy` 把 `/api` 代理到 `http://localhost:8080`，`pathRewrite: {'^/api':'/admin'}`。
  - 生产期：nginx `location /api/ { proxy_pass http://sky-takeout-backend:8080/admin/; }`。
  - 两侧同构，前端源码无需按环境改任何前缀。
- 统一响应体 `{ code, msg, data }`：成功 `code === 1`；业务失败仍是 **HTTP 200 + code 0**（不能看 HTTP 状态码判定）。未登录/令牌异常才返回 **HTTP 401**，响应拦截器会 `router.push('/login')`。
- 请求头字段名 **`token`**（无 `Bearer` 前缀），token 存在 **cookie `token`**（`src/utils/cookies.ts`）；路由守卫 `src/permission.ts` 亦按 `Cookies.get('token')` 判断。
- 分页：入参 `page` / `pageSize`；出参取 `data.data.total` 与 `data.data.records`。
- 错误提示统一读 `res.data.msg`（后端没有 `message` / `desc` 字段）。
- 登录 `POST /employees/login`，**密码明文提交**（后端自行做 MD5，前端不要加密）；登录失败同样是 HTTP 200 + code 0。
- 图片上传是全工程唯一的 `<el-upload>`（`src/components/ImgUpload/index.vue`），**不走 axios 实例**，`action` 自行拼 `${VUE_APP_BASE_API}/files/dish` 或 `/files/setmeal`，表单字段名 `file`。

## WebSocket（`src/layout/components/Navbar/index.vue`）

- 全工程唯一的 WebSocket 连接在此。地址**运行期由 `location` 推导**：`ws(s)://location.host/ws/<随机串>`（https 页面自动用 wss）；开发期由 devServer 代理 `/ws`、生产由 nginx 转发。
- `VUE_APP_SOCKET_URL` **已废弃**：`src/**` 已无任何引用（`.env.production` 中已标注废弃）。**不要改回写死地址**（见「坑」第 5 条）。
- 消息为 JSON：`type === 1` 来单提醒（播 `audioVo`）、`type === 2` 催单（播 `audioVo2`），含 `orderId` / `content`；解析失败或未知类型只 `console.warn`、不弹窗。
- `onclose` 后 5 秒重连一次；音频受浏览器自动播放策略限制，需首次用户交互后解锁（组件内已处理）。

## 品牌名唯一来源（`src/config/brand.json`）

- `brand.json` 的 `brandName` 是**唯一来源**：`vue.config.js` `require` 它，注入 `public/index.html` 的 `<title>` / `apple-mobile-web-app-title`，并替换 `public/manifest.json` 的 `__BRAND_NAME__` 占位符；运行期 `src` 侧 `import brand from '@/config/brand.json'`（如 `src/router.ts` 的路由 `meta.title`）。改这一处即可全站生效。

## 部署物料（`deploy/`）

- `Dockerfile.frontend`：容器内用 `node:16.20.2` 构建、`nginx:1.27-alpine` 托管 `dist-sky/sky`；**构建上下文是仓库根目录**。
- `nginx/default.conf`：`/` → 前端静态（hash 路由，`try_files` 兜底）；`/api/` → `sky-takeout-backend:8080/admin/`（路径重写）；`/ws/` → 后端（带升级头、放大超时）；`/user/` → 后端（直通，供从管理端端口调试用户端接口；Web 用户端本身是独立容器与独立端口，不走这份 nginx，故不再有 `/web/`）。
- `docker-compose.yml`：编排 mysql + redis + backend + nginx，**只发布 80 端口**，其余容器不对外。**网络名与卷名已用 `name:` 固定**（`sky-takeout-net` / `sky-takeout-mysql-data`），不随 compose 项目名（默认取目录名）变化，供其它 compose（Web 用户端）以 `external: true` 接入同一网络。
- `scripts/*.sh`：本机导出库、服务器载镜像/导入库/重置库。
- 生产所需的 `VUE_APP_BASE_API` / `VUE_APP_DELETE_PERMISSIONS` 在 `Dockerfile.frontend` 里以 `ARG`/`ENV` **显式注入**——因为 `.env*` 不入库，新克隆仓库会缺文件（见「坑」第 3 条）。
- 根目录 `.dockerignore` 挡掉 `node_modules` / `dist` / `dist-sky` / `draft` / `.env*` 等，避免打进构建上下文。

## 只读基准与不许动的目录（`vue.config.js` 顶部注释）

- **`dist/`（尤其 `dist/sky/`）是「从产物还原」的只读基准**（含原始 `service-worker.js` / `precache-manifest.*`），**严禁修改**，也严禁把 `outputDir` 指回 `dist`（会被覆盖）。
- 构建产物一律输出到 `dist-sky/`。`dist/` 与 `dist-sky/` 均在 `.gitignore` 中。

## 接口对照表（`docs/admin-api-mapping.md`）

- 一份「前端函数 ↔ 后端管理端端点」的逐函数对照（当前 46 个函数），并给出统一响应、token 头、分页、时间格式等全局约定。
- 注意：文中「改造前原状 / 差异类别 / 跨模块字段对照」几节是**改造前的历史观察**，不代表现存问题。

## 容易踩的坑

1. **接口字面量的前缀由代理层负责，绝不能写进字面量。** 路径里出现 `/admin`（或 `/api`）会让生产环境请求到不存在的路径、**全站 404**，而开发期因为 devServer 代理恰好正常、**完全看不出来**。改接口只写资源路径（如 `/dishes`）。
2. **`tsc` 不检查 `.vue` 文件。** 本仓库没有类型检查脚本；`npx tsc --noEmit` 只覆盖 `.ts` 文件——tsc 根本不解析 `.vue`，且 `src/shims-vue.d.ts` 把 `*.vue` 一律声明为 `Vue` 基类型。`.vue` 的语法/类型错误**只能在 `npm run build` 时**由 `@vue/cli-plugin-typescript` 暴露。改了 `.vue` 后要跑一次 build 才知道有没有错。
3. **`.env*` 不入库。** 新克隆 / 换机器后必须先 `cp .env.example .env`，否则 `VUE_APP_BASE_API` 为空 → `baseURL` 编译成 `undefined` → 全站请求打到根路径、**全部 404，而构建过程不报任何错**（静默产物错误）。生产构建由 Dockerfile 显式注入以规避。
4. **业务成败只能按 `code === 1` 判定。** 后端业务失败同样返回 HTTP 200，不能看 HTTP 状态码；错误信息字段是 `msg`。
5. **WebSocket 地址不要写死主机。** 写死（如 `ws://localhost/ws/`）会被编译进产物，部署后浏览器里的 `localhost` 指访问者自己的电脑，实时提醒永远连不上而页面其余部分看着正常。现实现运行时用 `location` 推导，别改回去。
6. **图片上传不走 axios 拦截器**，`<el-upload>` 的 `action` 需自行带 `/api` 前缀，字段名固定 `file`。
7. **构建一致性**：Node ≥ 18 时产物文件名哈希与基准不同（内容一致）；要与基准逐文件名比对，须用 Node 16.20.2（`.nvmrc`）。
8. **路由是 hash 模式**（未显式设 `mode`，vue-router 3 默认 hash），生产 nginx 靠 `try_files ... /index.html` 兜底；新增/改动路由时不要假设 history 模式。
