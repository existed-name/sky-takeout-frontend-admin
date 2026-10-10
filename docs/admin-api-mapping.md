# 管理端前端接口对照表

本文说明管理端前端各个请求函数与后端管理端端点之间的对应关系，供查阅与维护使用。

---

## 一、用途与阅读口径

### 1.1 本文用途

本文用于查阅：管理端前端的**某个请求函数**对应**后端哪个端点**、使用**哪种 HTTP 方法**、携带**什么参数或请求体**、返回**什么数据结构**。文末另附全局约定、跨模块字段对照、无后端对应的功能清单与注意事项。

### 1.2 路径与写法约定

- 正文里的前端短路径（如 `src/api/dish.ts`、`src/views/dish/index.vue`）均指**前端工程根**下的同路径；后端短路径（如 `sky-server/...`、`sky-pojo/...`、`sky-common/...`）均指**后端工程根**下的同路径。
- 后端端点一律写作**到达后端服务时的相对路径**（如 `/admin/categories`），不含主机名与端口。后端未配置 `context-path`，管理端真实前缀就是各控制器自带的 `/admin/**`。
- 前端接口字面量一律**不带 `/admin`**（原因见「二、全局约定」第 1 条）。
- 除登录端点外，所有管理端端点都需要携带 `token` 请求头。

### 1.3 阅读口径（重要）

本文表格中的「**改造前原状**」与「**差异类别**」两列，记录的是**前端代码对齐到后端之前**的原状与当时的差异分类，用途仅是**追溯每一处改动的来由**。**当前源码已经是改造后的状态，不再与后端存在这些差异**；请以「前端路径 / 后端真实端点 / 参数与请求体 / 响应结构」等列描述的最终对应关系为准。「跨模块字段对照」一节同样记录改造前的字段级观察。

### 1.4 计数总览

| 口径 | 数量（改造前 / 当前） | 说明 |
|---|---|---|
| 前端请求函数总数 | 54 / 46 | 按 `src/api/` 下各模块文件导出的 axios 请求函数统计；改造前 54 个中有 8 个已移除（`src/api/inform.ts` 整文件 4 个，分类 / 菜品 / 店铺 / 报表各 1 个），当前实际导出 46 个 |
| 可对齐到后端真实端点 | 47 / 46 | 改造前 47 个中，分类「启用禁用」1 个随后端未返回 `status` 字段、页面裁剪该功能而一并清理，其余 46 个当前全部可对齐 |
| 无后端对应（功能缺口） | 7 / 0 | 改造前为 4 个站内消息函数 + 数据概览、修改密码、通用下载各 1 个，均已随相应功能裁剪，见第五节 |
| 仅「批量维度」无后端支持（函数本身可对齐） | 2 / 2 | 菜品、套餐的批量改状态 |
| 非 axios 的调用点（不属于上述函数） | 2 / 2 | 图片上传、实时消息连接 |

本文的逐函数对照表按 **8 个业务模块**分组：分类 / 菜品 / 套餐 / 员工 / 店铺 / 订单 / 报表 / 工作台。站内消息相关的 4 个请求函数全部无后端对应，统一归入「五、无后端对应（已裁剪）的功能清单」。

---

## 二、全局约定

> 以下是与具体业务无关、对全前端一次性生效的约定。

| # | 事项 | 前端实现 | 后端实现 | 说明 |
|---|---|---|---|---|
| 1 | 请求前缀与代理层映射 | axios 实例 `baseURL = process.env.VUE_APP_BASE_API`（`src/utils/request.ts`），四个环境变量文件中该值均为 `/api`；接口文件中的路径字面量既不写 `/api`，也不带 `/admin` | 无 `context-path`；管理端真实前缀即各控制器自带的 `/admin/**`；端口 `8080`；未配置 CORS | `/api` 到 `/admin` 的映射属于**代理层**：开发期由 `vue.config.js` 的 `devServer.proxy` 完成（`/api` 代理到 `http://localhost:8080`，并用 `pathRewrite` 把 `^/api` 改写为 `/admin`）；生产期由 nginx 完成（`location /api/ { proxy_pass http://localhost:8080/admin/; }`）。两侧同构。**接口字面量一律不带 `/admin`**，否则生产环境会请求到不存在的路径、导致全站 404。开发服务器端口固定为 `8888`（默认 `8080` 会与后端冲突）。 |
| 2 | 统一响应与成功码 | 响应拦截器（`src/utils/request.ts`）不对失败做统一拦截；成功与否由各页面按 `code === 1` 判定 | 统一响应体 `{ code, msg, data }`，成功 `code = 1`、失败 `code = 0`；除「未登录 / 令牌异常」返回 HTTP 401 外，其余业务失败一律 HTTP 200 + `code = 0` | 判定只能用 `code === 1`；响应体没有 `status` 字段，不能按 HTTP 状态码或 `status` 判业务成败。 |
| 3 | 令牌请求头 | `config.headers['token'] = token`（`src/utils/request.ts`），无 `Bearer` 前缀；图片上传组件单独设置 `token` 头 | 头名为 `token`（配置项 `admin-token-name: token`），直接取值、不加 `Bearer` 前缀；用户端使用另一个头名 `authentication` | 除登录端点外都需携带 `token`；不要混用 `authentication`。 |
| 4 | 分页参数与返回字段 | 入参 `page` / `pageSize`；出参取 `data.data.total` 与 `data.data.records` | 入参 `page`、`pageSize`（均 `@NotNull` 必填），无 `pageNum`；返回 `Result<PageResult<T>>`，`PageResult` 字段为 `total`、`records` | 分页参数均为必填，缺失会被参数校验拦截、返回 `code = 0`。 |
| 5 | 错误提示字段 | 页面普遍读取 `res.data.msg` | 统一响应只有 `msg` 字段（不是 `message`，也没有 `desc` / `status` / `success` / `errorCode`）；成功时 `msg` 为 `null` | 展示失败原因应统一读取 `msg`。 |
| 6 | 时间序列化与查询参数格式 | 订单页日期选择器 `value-format="yyyy-MM-dd HH:mm:ss"`；报表、工作台使用 `yyyy-MM-dd` | 全局 `JacksonObjectMapper`：`LocalDateTime` → `yyyy-MM-dd HH:mm`（无秒）、`LocalDate` → `yyyy-MM-dd`、`LocalTime` → `HH:mm:ss`。查询参数走 Spring `ConversionService`、不经过该对象映射器；报表与工作台控制器显式标注了 `@DateTimeFormat(pattern = "yyyy-MM-dd[ HH:mm:ss]")`，订单查询 DTO 未标注 | 向 `LocalDateTime`（JSON 请求体）传值用 `yyyy-MM-dd HH:mm`；展示后端返回时间按无秒处理；报表、工作台统一传 `yyyy-MM-dd`；订单查询参数的时间格式无法从源码断言，需实测（见「六、注意事项」）。 |
| 7 | 图片上传 | 全工程唯一的 `<el-upload>` 在 `src/components/ImgUpload/index.vue`；`:action` 绑定计算属性 `uploadAction`，按 `businessType` 分流为 `${VUE_APP_BASE_API}/files/dish` 或 `${VUE_APP_BASE_API}/files/setmeal`（自行带上 `/api` 前缀，不走 axios 实例）；显式写 `name="file"`；`:headers` 绑定计算属性 `headers`，令牌由 `getToken()` 每次动态取值（不是只在组件创建时取一次的实例字段）；成功回调 `handleAvatarSuccess` 判 `response.code !== 1`；错误回调 `handleError` 处理 HTTP 401（提示登录失效并跳登录）；成功后取 `response.data` | 菜品图片 `POST /admin/files/dish`、套餐图片 `POST /admin/files/setmeal`；表单字段名 `file`（`@RequestPart(name="file")`）；`multipart/form-data`；需带 `token`；返回 `Result<String>`，`data` 直接是图片 URL | `action` 已按业务类型分流到上述两个端点，并自行带上 `/api` 前缀（不走 axios 拦截器，前缀由组件内的 `VUE_APP_BASE_API` 提供）；`name` 显式写为 `file`、`headers` 动态取 `token`、成功回调判 `code`、错误回调处理 401，均与后端约定一致。 |
| 8 | 实时消息（WebSocket） | 唯一连接在 `src/layout/components/Navbar/index.vue`：`new WebSocket(VUE_APP_SOCKET_URL + 随机串)`；握手不带 `token`；只接收不发送；`onmessage` 按 `jsonMsg.type` 分支（1 来单提醒、2 客户催单），使用 `content`、`orderId` | 端点 `@ServerEndpoint("/ws/{sid}")` → `ws://<host>:8080/ws/<sid>`；握手无鉴权；服务端群发；消息体为 `{ type, orderId, content }` | 解析字段与后端一致；`sid` 由客户端自定、服务端不校验。`VUE_APP_SOCKET_URL` 开发期为 `ws://localhost:8080/ws/`、生产期为 `ws://localhost/ws/`（由 nginx 在 80 端口代理 `/ws/`），需按部署环境核对（见「六、注意事项」）。 |

---

## 三、各模块逐函数对照表

> 列含义：**前端函数**（含所在文件）/ **HTTP 方法** 与 **前端路径**（对齐后的最终形态）/ **后端真实端点** / **参数 / 请求体** / **响应结构** / **改造前原状** 与 **差异类别**（仅追溯，见 1.3）/ **备注**。

### 3.1 分类模块

模块文件：`src/api/category.ts`（改造前 5 个请求函数，当前 4 个）

| 前端函数 | HTTP 方法 | 前端路径 | 后端真实端点 | 参数 / 请求体 | 响应结构 | 改造前原状 | 差异类别 | 备注 |
|---|---|---|---|---|---|---|---|---|
| `getCategoryPage` | GET | `/categories` | `GET /admin/categories` | Query 绑定 `CategoryPageQueryDTO`：`page`（必填）、`pageSize`（必填）、`name`、`type` | `Result<PageResult<CategoryPageQueryItemVO>>`（`records` / `total`） | `GET /category/page`，`params` 透传 | 前缀 + 资源名复数 + 路径结构 | 分页参数名一致 |
| `deleCategory` | DELETE | `/categories/{id}` | `DELETE /admin/categories/{id}` | 路径变量 `id`（必填、正整数）；不接收 Query 形式的 `id` | `Result<Void>` | `DELETE /category`，`params: { id: ids }` | 前缀 + 资源名复数 + 参数位置 + 路径结构 | 函数名 `deleCategory` 少一个字母 `t`，这是源码实际名称，勿改错；后端为单条删除、不支持批量 |
| `editCategory` | PUT | `/categories/{id}` | `PUT /admin/categories/{id}` | 路径变量 `id`；请求体 `CategoryDTO = { type, name, sort }`（更新分组下三者均必填），无 `id` 字段 | `Result<Void>` | `PUT /category`，`data: { ...params }`（`id` 在请求体） | 前缀 + 资源名复数 + 参数位置 + 请求体字段 + 路径结构 | 请求体需剔除 `id`；调用方需补 `type`，否则后端返回 `code = 0` 的「分类类型不能为空」 |
| `addCategory` | POST | `/categories` | `POST /admin/categories` | 请求体 `CategoryDTO = { type, name, sort }`（新增分组下三者均必填） | `Result<Void>` | `POST /category`，`data: { ...params }` | 前缀 + 资源名复数 | `type` 现为字符串 `'1'` / `'2'`，建议传数字（Jackson 可自动转换） |
| `enableOrDisableEmployee` | PUT | `/categories/{id}/status` | `PUT /admin/categories/{id}/status` | 路径变量 `id`；请求体 `CategoryStatusDTO = { status }`（`Integer`，1 启用 0 禁用） | `Result<Void>` | `POST /category/status/${params.status}`，`params: { id }` | HTTP 方法 + 路径结构 + 参数位置 + 请求体字段 | 与员工模块的同名函数用途不同，勿混；该导出在当前源码中已随「依赖缺失字段的分类操作」一并清理 |

### 3.2 菜品模块

模块文件：`src/api/dish.ts`（改造前 10 个请求函数，当前 9 个）

| 前端函数 | HTTP 方法 | 前端路径 | 后端真实端点 | 参数 / 请求体 | 响应结构 | 改造前原状 | 差异类别 | 备注 |
|---|---|---|---|---|---|---|---|---|
| `getDishPage` | GET | `/dishes` | `GET /admin/dishes` | Query 绑定 `DishPageQueryDTO`：`page`（必填）、`pageSize`（必填）、`name`、`categoryId`、`status` | `Result<PageResult<DishPageQueryItemVO>>` | `GET /dish/page`，`params` 透传 | 前缀 + 资源名复数 + 路径结构 | 分页参数名一致 |
| `deleteDish` | DELETE | `/dishes` | `DELETE /admin/dishes` | Query `@RequestParam List<Long> ids`（必填、非空） | `Result<Void>` | `DELETE /dish`，`params: { ids }`（逗号拼接字符串） | 前缀 + 资源名复数 + 需实测 | `ids` 的逗号形式能否被接收需实测（见「六、注意事项」） |
| `editDish` | PUT | `/dishes/{id}` | `PUT /admin/dishes/{id}` | 路径变量 `id`；请求体 `DishDTO = { name, categoryId, price, image, description, status, flavors }`，无 `id` 字段 | `Result<Void>` | `PUT /dish`，`id` 在请求体 | 前缀 + 资源名复数 + 参数位置 + 路径结构 | 请求体需剔除 `id` |
| `addDish` | POST | `/dishes` | `POST /admin/dishes` | 请求体 `DishDTO`（新增分组：`name` / `categoryId` / `price` / `image` 必填） | `Result<Void>` | `POST /dish`，`data: { ...params }` | 前缀 + 资源名复数 | `flavors[].value` 的序列化格式需实测（前端做 `JSON.stringify`，后端注释写的是 `list.toString`） |
| `queryDishById` | GET | `/dishes/{id}` | `GET /admin/dishes/{id}` | 路径变量 `id`（必填、正整数） | `Result<DishVO>`；返回的 `DishVO` 不含 `status` / `updateTime` | `GET /dish/${id}` | 前缀 + 资源名复数 | `DishVO` 不返回 `status` / `updateTime`，编辑页按 `status` 回填会取到 `undefined` |
| `getCategoryList` | GET | `/categories/list` | `GET /admin/categories/list` | Query `type`（非必填） | `Result<List<CategoryListItemVO>>`（含 `id` / `type` / `name`） | `GET /category/list`，`params` 透传 | 前缀 + 资源名复数 | 与套餐模块的同名函数同路径，两处需同步改 |
| `queryDishList` | GET | `/dishes/list` | `GET /admin/dishes/list` | Query `categoryId`（非必填，为空查全部） | `Result<List<DishListItemVO>>`（含 `id` / `name` / `categoryId` / `price` / `status`，无 `image`） | `GET /dish/list`，`params` 透传 | 前缀 + 资源名复数 | 列表项无 `image` 字段，若界面要展示图片需另行取数 |
| `commonDownload` | GET | `/common/download` | 无对应端点 | （原为 `params` 透传） | — | `GET /common/download`，`params` 透传 | 无后端对应（功能缺口） | 后端没有下载端点；该导出在当前源码中已移除（见第五节） |
| `dishStatusByStatus` | PUT | `/dishes/{id}/status` | `PUT /admin/dishes/{id}/status` | 路径变量 `id`；请求体 `DishStatusDTO = { status }`（`Integer`） | `Result<Void>` | `POST /dish/status/${params.status}`，`params: { id }` | 前缀 + 资源名复数 + HTTP 方法 + 路径结构 + 参数位置 + 请求体字段 + 批量维度缺口 | 仅支持单条；批量改状态无后端端点，需前端循环逐个调用；`status` 需传数字 |
| `dishCategoryList` | GET | `/categories/list` | `GET /admin/categories/list` | Query `type`（非必填） | `Result<List<CategoryListItemVO>>` | `GET /category/list`，`params: { ...params }` | 前缀 + 资源名复数 | 与套餐模块的同名函数同路径，两处需同步改 |

### 3.3 套餐模块

模块文件：`src/api/setMeal.ts`（改造前 7 个请求函数，当前 7 个）

| 前端函数 | HTTP 方法 | 前端路径 | 后端真实端点 | 参数 / 请求体 | 响应结构 | 改造前原状 | 差异类别 | 备注 |
|---|---|---|---|---|---|---|---|---|
| `getSetmealPage` | GET | `/setmeals` | `GET /admin/setmeals` | Query 绑定 `SetmealPageQueryDTO`：`page`（必填）、`pageSize`（必填）、`name`、`categoryId`、`status` | `Result<PageResult<SetmealPageQueryItemVO>>` | `GET /setmeal/page`，`params` 透传 | 前缀 + 资源名复数 + 路径结构 | 分页参数名一致 |
| `deleteSetmeal` | DELETE | `/setmeals` | `DELETE /admin/setmeals` | Query `@RequestParam List<Long> ids`（必填、非空） | `Result<Void>` | `DELETE /setmeal`，`params: { ids }`（逗号拼接字符串） | 前缀 + 资源名复数 + 需实测 | `ids` 的逗号形式能否被接收需实测 |
| `editSetmeal` | PUT | `/setmeals/{id}` | `PUT /admin/setmeals/{id}` | 路径变量 `id`；请求体 `SetmealDTO = { categoryId, name, price, status, description, image, setmealDishes }`，无 `id` 字段 | `Result<Void>` | `PUT /setmeal`，`id` 在请求体 | 前缀 + 资源名复数 + 参数位置 + 路径结构 | 请求体需剔除 `id` |
| `addSetmeal` | POST | `/setmeals` | `POST /admin/setmeals` | 请求体 `SetmealDTO`（新增分组：`categoryId` / `name` / `price` / `image` 必填） | `Result<Void>` | `POST /setmeal`，`data: { ...params }` | 前缀 + 资源名复数 | `setmealDishes[{ copies, dishId, name, price }]` 与后端字段名一致，多余字段被忽略 |
| `querySetmealById` | GET | `/setmeals/{id}` | `GET /admin/setmeals/{id}` | 路径变量 `id`（必填、正整数） | `Result<SetmealInfoVO>`（含 `status` / `image` / `setmealDishes` / `categoryId` / `categoryName`） | `GET /setmeal/${id}` | 前缀 + 资源名复数 | 返回字段与编辑页读取一致 |
| `setmealStatusByStatus` | PUT | `/setmeals/{id}/status` | `PUT /admin/setmeals/{id}/status` | 路径变量 `id`；请求体 `SetmealStatusDTO = { status }`（`Integer`） | `Result<Void>` | `POST /setmeal/status/${params.status}`，`params: { id: params.ids }` | 前缀 + 资源名复数 + HTTP 方法 + 路径结构 + 参数位置 + 请求体字段 + 批量维度缺口 | 仅支持单条；批量改状态无后端端点，需前端循环调用；入参键名已与菜品 / 员工 / 分类统一为 `id` |
| `dishCategoryList` | GET | `/categories/list` | `GET /admin/categories/list` | Query `type`（非必填） | `Result<List<CategoryListItemVO>>` | `GET /category/list`，`params: { ...params }` | 前缀 + 资源名复数 | 与菜品模块的同名函数同路径，两处需同步改 |

### 3.4 员工模块

模块文件：`src/api/employee.ts`（改造前 7 个请求函数，当前 7 个）

| 前端函数 | HTTP 方法 | 前端路径 | 后端真实端点 | 参数 / 请求体 | 响应结构 | 改造前原状 | 差异类别 | 备注 |
|---|---|---|---|---|---|---|---|---|
| `login` | POST | `/employees/login` | `POST /admin/employees/login` | 请求体 `EmployeeLoginDTO = { username, password }`（均必填） | `Result<EmployeeLoginVO>`（`data.token`） | `POST /employee/login`，`data: { username, password }` | 前缀 + 资源名复数 | 唯一免登录端点；密码按明文提交，由后端自行做 MD5，前端不要加密 |
| `userLogout` | POST | `/employees/logout` | `POST /admin/employees/logout` | 无入参，需带 `token` | `Result<Void>` | `POST /employee/logout`，`params` 透传 | 前缀 + 资源名复数 + 参数位置 | 后端不做实际登出（不会使 `token` 失效），前端需自行清本地 `token` |
| `getEmployeeList` | GET | `/employees` | `GET /admin/employees` | Query 绑定 `EmployeePageQueryDTO`：`page`（必填）、`pageSize`（必填）、`name` | `Result<PageResult<EmployeePageQueryItemVO>>` | `GET /employee/page`，`params` 透传 | 前缀 + 资源名复数 + 路径结构 | 分页参数名一致 |
| `enableOrDisableEmployee` | PUT | `/employees/{id}/status` | `PUT /admin/employees/{id}/status` | 路径变量 `id`；请求体 `EmployeeStatusDTO = { status }`（`Integer`，1 启用 0 禁用） | `Result<Void>` | `POST /employee/status/${params.status}`，`params: { id }` | HTTP 方法 + 路径结构 + 参数位置 + 请求体字段 | 与分类模块的同名函数用途不同，勿混 |
| `addEmployee` | POST | `/employees` | `POST /admin/employees` | 请求体 `EmployeeDTO = { username, name, phone, sex, idNumber }`（五项均必填）；`sex` 校验 `^[12]$`（1 男 2 女）；`phone` 校验 `^1[3-9]\d{9}$` | `Result<Void>` | `POST /employee`，`data: { ...params }` | 前缀 + 资源名复数 + 请求体字段（`sex` 取值） | `sex` 只接受 `1` / `2`，「女」应传 `2`（曾出现传 `0` 被校验拦截） |
| `editEmployee` | PUT | `/employees/{id}` | `PUT /admin/employees/{id}` | 路径变量 `id`；请求体 `EmployeeDTO`（五字段，同上），无 `id` 字段 | `Result<Void>` | `PUT /employee`，`id` 在请求体 | 前缀 + 资源名复数 + 参数位置 + 请求体字段（`sex` 取值）+ 路径结构 | 请求体需剔除 `id`；`sex` 映射同 `addEmployee` |
| `queryEmployeeById` | GET | `/employees/{id}` | `GET /admin/employees/{id}` | 路径变量 `id`（必填、正整数） | `Result<EmployeeVO>`（含 `sex`，值 `"1"` / `"2"`） | `GET /employee/${id}` | 前缀 + 资源名复数 | 回填需按 `sex` 为 `"1"` / `"2"` 判断男女（曾按 `"0"` 判断导致女性回显为「男」） |

### 3.5 店铺模块

模块文件：`src/api/users.ts`（改造前 3 个请求函数，当前 2 个）

| 前端函数 | HTTP 方法 | 前端路径 | 后端真实端点 | 参数 / 请求体 | 响应结构 | 改造前原状 | 差异类别 | 备注 |
|---|---|---|---|---|---|---|---|---|
| `editPassword` | PUT | `/employee/editPassword` | 无对应端点 | （原为 `data: { oldPassword, newPassword }`） | — | `PUT /employee/editPassword`，`data` 传新旧密码 | 无后端对应（功能缺口） | 后端未实现「修改密码」能力；该导出在当前源码中已移除（见第五节）；禁止凭外部教程猜测路径 |
| `getStatus` | GET | `/shop/status` | `GET /admin/shop/status` | 无入参 | `Result<Integer>`（`data`：1 营业中 0 打烊） | `GET /shop/status`（仅缺前缀） | 仅缺前缀 | 取值语义与后端一致 |
| `setStatus` | PUT | `/shop/status` | `PUT /admin/shop/status` | 请求体 `ShopStatusDTO = { status }`（`Integer` 必填） | `Result<Void>` | `PUT /shop/<数值>`，裸数字既在路径又作请求体 | 仅缺前缀 + 路径结构 + 请求体字段 | 与站内消息模块的同名 `setStatus` 不同用途，勿混 |

### 3.6 订单模块

模块文件：`src/api/order.ts`（改造前 8 个请求函数，当前 8 个）

| 前端函数 | HTTP 方法 | 前端路径 | 后端真实端点 | 参数 / 请求体 | 响应结构 | 改造前原状 | 差异类别 | 备注 |
|---|---|---|---|---|---|---|---|---|
| `getOrderDetailPage` | GET | `/orders` | `GET /admin/orders` | Query 绑定 `AdminOrderPageQueryDTO`：`page`（必填）、`pageSize`（必填）、`beginTime`（选填）、`endTime`（选填）、`number`（选填）、`phone`（选填）、`status`（选填） | `Result<PageResult<OrderPageQueryItemVO>>` | `GET /order/conditionSearch`，`params` 透传 | 前缀 + 资源名复数 + 路径结构 | `beginTime` / `endTime` 的时间串格式需实测 |
| `queryOrderDetailById` | GET | `/orders/{id}` | `GET /admin/orders/{id}` | 路径变量 `id`（`Long`、`@Positive`） | `Result<AdminOrderInfoVO>` | `GET /order/details/${params.orderId}` | 前缀 + 资源名复数 + 路径结构 | 后端路径变量名为 `id`，前端入参键名 `orderId` 可保留，仅改 url 模板 |
| `deliveryOrder` | PUT | `/orders/{id}/delivery` | `PUT /admin/orders/{id}/delivery` | 路径变量 `id`；无请求体 | `Result<Void>` | `PUT /order/delivery/${params.id}` | 前缀 + 资源名复数 + 路径结构 | `id` 与动作词位置对调（后端为 `/{id}/delivery`） |
| `completeOrder` | PUT | `/orders/{id}/completion` | `PUT /admin/orders/{id}/completion` | 路径变量 `id`；无请求体 | `Result<Void>` | `PUT /order/complete/${params.id}` | 前缀 + 资源名复数 + 路径结构 | 动作词由 `complete` 改为名词 `completion`，且 `id` 在动作词之前 |
| `orderCancel` | PUT | `/orders/{id}/cancelation` | `PUT /admin/orders/{id}/cancelation` | 路径变量 `id`；请求体 `AdminOrderCancelDTO = { cancelReason }`（`@NotBlank` 必填），无 `id` 字段 | `Result<Void>` | `PUT /order/cancel`，`data: { id, cancelReason }` | 前缀 + 资源名复数 + 路径结构 + 参数位置 + 请求体字段 | 路径拼写是单 `l` 的 `cancelation`，别写成 `cancellation`；请求体不再含 `id` |
| `orderAccept` | PUT | `/orders/{id}/acceptance` | `PUT /admin/orders/{id}/acceptance` | 路径变量 `id`；无请求体 | `Result<Void>` | `PUT /order/confirm`，`data: { id }` | 前缀 + 资源名复数 + 路径结构 + 参数位置 + 请求体字段 | 路径词为 `acceptance`（不是 `confirm`），接口不接收请求体 |
| `orderReject` | PUT | `/orders/{id}/rejection` | `PUT /admin/orders/{id}/rejection` | 路径变量 `id`；请求体 `OrdersRejectionDTO = { rejectionReason }`（`@NotBlank` 必填），无 `id` 字段 | `Result<Void>` | `PUT /order/rejection`，`data: { id, rejectionReason }` | 前缀 + 资源名复数 + 路径结构 + 参数位置 + 请求体字段 | 请求体不再含 `id` |
| `getOrderListBy` | GET | `/orders/statistics` | `GET /admin/orders/statistics` | 无入参 | `Result<...>`（`toBeConfirmed` / `confirmed` / `deliveryInProgress`） | `GET /order/statistics`，形参声明但未使用 | 前缀 + 资源名复数 | 子路径 `statistics` 一致，仅补 `/admin/orders` 前缀；消费字段与前端读法一致，无需改 |

> 订单状态动作类端点在后端统一为「`/admin/orders/{id}/<动作名词>`」：接单 `PUT /admin/orders/{id}/acceptance`（无请求体）、拒单 `PUT /admin/orders/{id}/rejection`（请求体 `{ rejectionReason }`）、取消 `PUT /admin/orders/{id}/cancelation`（请求体 `{ cancelReason }`，**单 `l`**）、派送 `PUT /admin/orders/{id}/delivery`（无请求体）、完成 `PUT /admin/orders/{id}/completion`（无请求体）；均返回 `Result<Void>`。三个易错点：① `cancelation` 单 `l`；② 接单是 `acceptance` 而不是 `confirm`（后端已明确弃用 `confirm` 一词）；③ 请求体不能放 `id`（`id` 走路径）。

> 另注：后端另有 4 个「漏传 id 兜底端点」（`PUT /admin/orders/rejection`、`/cancelation`、`/delivery`、`/completion`），均恒返回失败 `{"code":0,...}`，前端不应主动调用；接单没有对应的兜底端点，行为与其余四个不同。详见「五、无后端对应（已裁剪）的功能清单」中的记录备查项。

### 3.7 报表模块

模块文件：`src/api/index.ts`（`/report/*` 部分，改造前 6 个请求函数，当前 5 个）

| 前端函数 | HTTP 方法 | 前端路径 | 后端真实端点 | 参数 / 请求体 | 响应结构 | 改造前原状 | 差异类别 | 备注 |
|---|---|---|---|---|---|---|---|---|
| `getTurnoverStatistics` | GET | `/report/turnover-statistics` | `GET /admin/report/turnover-statistics` | Query `begin`（必填 `LocalDate`）、`end`（必填 `LocalDate`），格式 `yyyy-MM-dd[ HH:mm:ss]` | `Result<...>`，`data.items[{ date, turnover }]` | `GET /report/turnoverStatistics`，`params: { begin, end }` | 前缀 + 资源名复数 + 路径结构 + 响应结构 | 路径由驼峰改为连字符小写；响应由逗号分隔字符串改为对象数组 |
| `getUserStatistics` | GET | `/report/user-statistics` | `GET /admin/report/user-statistics` | Query `begin`、`end`（均必填 `LocalDate`） | `Result<...>`，`data.userCountList[{ date, total }]` + `data.userGrowthList[{ date, growth }]` | `GET /report/userStatistics`，`params: { begin, end }` | 前缀 + 资源名复数 + 路径结构 + 响应结构 | 响应由逗号分隔字符串改为对象数组 |
| `getOrderStatistics` | GET | `/report/order-statistics` | `GET /admin/report/order-statistics` | Query `begin`、`end`（均必填 `LocalDate`） | `Result<...>`，`data.orderCountList[{ date, count }]`、`data.validOrderCountList[{ date, count }]`、`data.totalOrderCount`、`data.validOrderCount`、`data.orderCompletionRate` | `GET /report/ordersStatistics`，`params: { begin, end }` | 前缀 + 资源名复数 + 路径结构 + 响应结构 | 路径中 `orders` 改为单数 `order`；`orderCountList` / `validOrderCountList` 名字与旧接口相同但类型由字符串变为对象数组 |
| `getTop` | GET | `/report/sales-statistics` | `GET /admin/report/sales-statistics` | Query `topN`（选填，默认 `"10"`）、`begin`（必填 `LocalDate`）、`end`（必填 `LocalDate`） | `Result<...>`，`data.items[{ name, salesCount }]` | `GET /report/top10`，`params: { begin, end }` | 路径结构 + 响应结构 | 后端路径名为「销量统计」，与旧路径 top10 完全不同；`topN` 可不传（默认 10）；排序方向需实测（见注意事项） |
| `getDataOverView` | GET | `/report/dataOverView` | 无对应端点 | （原为 `params` 透传） | — | `GET /report/dataOverView`，`params` 透传 | 无后端对应（功能缺口） | 后端无此端点；该导出在当前源码中已移除（见第五节）。如需数据概览，可改用 `GET /admin/workspace/overview/data`（须传 `date`），属功能重定向 |
| `exportInfor` | GET | `/report/export` | `GET /admin/report/export` | Query `begin`（必填 `LocalDate`）、`end`（必填 `LocalDate`） | Excel 文件流（非 JSON，服务端直接写 `HttpServletResponse`） | `GET /report/export`，无任何参数，`responseType: "blob"` | 仅缺前缀 + 缺必填参数 + 返回文件流 | 必须补 `begin` / `end`，否则返回的是 JSON 错误体而非文件；成功判定不能按 `code === 1`，需做 blob 类型防御（见注意事项） |

> 报表 4 个取数接口（营业额、用户、订单、销量）的响应结构已由「逗号分隔字符串」改为「对象数组」；消费侧需按对象数组映射字段，不能对已不存在的字段调用 `.split(',')`（否则会抛 `TypeError`、图表整块空白）。

### 3.8 工作台模块

模块文件：`src/api/index.ts`（`/workspace/*` 部分，改造前 4 个请求函数，当前 4 个）

| 前端函数 | HTTP 方法 | 前端路径 | 后端真实端点 | 参数 / 请求体 | 响应结构 | 改造前原状 | 差异类别 | 备注 |
|---|---|---|---|---|---|---|---|---|
| `getOrderData` | GET | `/workspace/overview/orders` | `GET /admin/workspace/overview/orders` | 无入参 | `Result<...>`（`waitingOrders` / `deliveredOrders` / `completedOrders` / `cancelledOrders` / `allOrders`） | `GET /workspace/overviewOrders` | 前缀 + 资源名复数 + 路径结构 | 单段路径拆成两段、全小写；响应字段与前端读法一致 |
| `getOverviewDishes` | GET | `/workspace/overview/dishes` | `GET /admin/workspace/overview/dishes` | 无入参 | `Result<...>`（`onSale` / `discontinued`） | `GET /workspace/overviewDishes` | 前缀 + 资源名复数 + 路径结构 + 消费侧字段名 | 消费侧应读 `onSale`（不是 `sold`）；`discontinued` 一致 |
| `getSetMealStatistics` | GET | `/workspace/overview/setmeals` | `GET /admin/workspace/overview/setmeals` | 无入参 | `Result<...>`（`onSale` / `discontinued`） | `GET /workspace/overviewSetmeals` | 前缀 + 资源名复数 + 路径结构 + 消费侧字段名 | 消费侧应读 `onSale`（不是 `sold`）；`discontinued` 一致 |
| `getBusinessData` | GET | `/workspace/overview/data` | `GET /admin/workspace/overview/data` | Query `date`（必填 `LocalDate`，`@RequestParam(required=true)`，格式 `yyyy-MM-dd[ HH:mm:ss]`） | `Result<DataOverviewVO>`（`newUsers` / `validOrderCount` / `orderCompletionRate` / `turnover` / `unitPrice`） | `GET /workspace/businessData`，无入参 | 路径结构 + 缺必填参数 | 必须补 `date`（`yyyy-MM-dd`），否则返回 `code = 0` 的「请求参数 date 不能为空」；该参数可直接复用 `src/utils/formValidate.ts` 的 `getday()`（当前输出为连字符格式的 `yyyy-MM-dd`，如 `2026-10-10`，工作台页面即取 `getday()[1]`） |

---

## 四、跨模块字段对照

> 以下为对齐改造前的字段级观察，用于追溯当时的处理判断；当前源码已按此调整，本节不代表现存问题。

### 4.1 前端读取但后端未返回的字段（会导致展示为空或报错）

| # | 位置 | 字段 | 后果 |
|---|---|---|---|
| 1 | `src/views/category/index.vue` | `row.status` | 后端分类分页项无 `status`，状态列恒显示「启用」，切换逻辑取值为 `undefined` |
| 2 | `src/views/category/index.vue` | `updateTime`（表格列） | 后端分页项只有 `createTime`、无 `updateTime`，「操作时间」列恒为空 |
| 3 | `src/views/employee/addEmployee.vue` | 回填按 `sex === '0'` 判断 | 后端 `EmployeeVO.sex` 只有 `"1"`（男）/ `"2"`（女）、无 `"0"`，女性员工会回显为「男」 |
| 4 | `src/views/employee/addEmployee.vue` | 提交 `sex` 映射 | 后端 `EmployeeDTO.sex` 校验 `^[12]$`，映射为 `0` 会被校验拦截 |
| 5 | `src/views/category/index.vue` | `res.data.desc` | 后端响应只有 `msg`，`desc` 恒为 `undefined`，失败提示恒为空字符串 |
| 6 | `src/views/dish/addDishtype.vue` | `DishVO.status` | 后端 `DishVO` 不返回 `status` / `updateTime`，编辑页售卖状态回填取到 `undefined` |
| 7 | `src/views/setmeal/components/AddDish.vue`（若用作缩略图） | `DishListItemVO.image` | 后端该 VO 无 `image`，图片取不到 |
| 8 | `src/views/orderDetails/index.vue`、`src/views/dashboard/components/orderList.vue`（「餐具数量」列） | `tablewareNumber` | 后端 `OrderPageQueryItemVO` 该字段被注释掉，两列恒为空（仅详情 `AdminOrderInfoVO` 才有值） |
| 9 | `src/views/orderDetails/index.vue`（「用户名」列） | `consignee` | 后端 `OrderPageQueryItemVO.consignee` 也被注释掉，列表该列恒为空；且此处用「收货人」当「用户名」（真正后端字段 `userName` 未被使用） |
| 10 | `src/views/orderDetails/index.vue` | 派送费写死 `6` | 后端 `AdminOrderInfoVO` 无「配送费」字段，前端写死 6 元，账目口径变化即算错（不报错） |
| 11 | `src/views/dashboard/components/cuisineStatistics.vue`、`setMealStatistics.vue` | `sold` | 后端字段名是 `onSale`，`sold` 不存在，「已启售」数字恒为空 |
| 12 | `src/views/statistics/index.vue` | 对 `dateList` / `turnoverList` / `totalUserList` / `newUserList` / `nameList` / `numberList` 调 `.split(',')` | 这些字段在后端已改为对象数组，对其调用 `.split` 会抛 `TypeError`，图表整块空白 |

### 4.2 后端返回但前端未使用的字段（属浪费项，不是错误）

| # | 来源端点 | 字段 | 说明 |
|---|---|---|---|
| 1 | `GET /admin/categories`（`CategoryPageQueryItemVO`） | `createTime` | 分类表格列用的是 `prop="updateTime"`，`createTime` 未被使用 |
| 2 | `GET /admin/orders`（`OrderPageQueryItemVO`） | `userName` | 列表不直接展示该字段（列表「用户名」列用的是 `consignee`） |
| 3 | `GET /admin/orders`（`OrderPageQueryItemVO`） | `deliveryStatus` | 订单列表模板未消费 |
| 4 | `GET /admin/orders/{id}`（`AdminOrderInfoVO`） | `id`、`status` | 详情弹窗用列表行 `row.id` 与状态文案驱动，不读 `diaForm.id` / `diaForm.status` |
| 5 | `GET /admin/orders/{id}` | `addressBookId`、`userId`、`payStatus`、`deliveryStatus`、`tablewareStatus`、`tablewareNumber` | 详情弹窗模板未使用 |
| 6 | `GET /admin/orders/{id}` | `estimatedDeliveryTime` | **实际被使用**，列出以示区别——不在未使用清单内 |

> 补充：`OrderPageQueryItemVO` 另有若干被后端注释掉的字段（如 `userId`、`addressBookId`、`checkoutTime`、`payMethod`、`payStatus`、`consignee`、`rejectionReason`、`packAmount`、`tablewareNumber`、`tablewareStatus`、`orderDetailList`），不会出现在列表响应里，不属「后端返回但前端未使用」。订单详情内嵌集合元素 `OrderDetail` 疑似会额外序列化出 `dish` / `setmeal` 两个布尔字段（前端未使用；未抓包验证）。

### 4.3 前端内部写法不一致（改造前的观察，供追溯）

| # | 位置 | 现象 |
|---|---|---|
| 1 | `src/views/category/index.vue` | 错误提示字段有三种写法：读 `res.data.desc`、读 `res.data.msg`、读 `res.data.desc` 或 `res.data.msg`；应统一为 `res.data.msg` |
| 2 | `src/views/category/index.vue` | 成功码判定有三种写法：`String(res.data.code) === '1'`、`res.data.code === 1`、`String(res.status) === '200'`（比较 HTTP 状态码，与按业务 `code` 判定矛盾） |
| 3 | `src/views/employee/index.vue`、`src/views/employee/addEmployee.vue` | 成功码判定写法不一致：分别用 `String(res.data.code) === '1'`、`String(res.status) === '200'`、`res.data.code === 1` |
| 4 | `src/views/dish/index.vue`、`src/views/setmeal/index.vue` | 菜品 / 套餐模块统一用 `res.data.code === 1`，未见 `res.status` 写法，模块内部一致 |
| 5 | `src/api/dish.ts` 与 `src/api/setMeal.ts` | 批量状态入参键名原本不统一（菜品用 `id`、套餐用 `ids`），改造时已统一为 `id` |
| 6 | `src/views/statistics/index.vue` 与 `src/views/dashboard/components/overview.vue` | 完成率一处做过 `* 100` 百分数转换、一处原样存入，属潜在口径不一致 |
| 7 | `src/views/orderDetails/index.vue` 的 `getOrderType` | `else` 分支无条件返回「退款」，但同文件页签只定义到「已取消」，分支数不一致 |
| 8 | `src/views/orderDetails/index.vue` | 「订单主键」在不同位置分别叫 `id` 与 `orderId`；`this.orderId` 实际存的是订单主键、注释却写「订单号」，命名前后不一致 |
| 9 | `src/views/orderDetails/index.vue` 与 `src/views/orderDetails/tabChange.vue` | 后端只有 1~6 六个状态；两处页签集合不一致（一处含「待付款」、另一处不含） |
| 10 | `src/views/statistics/index.vue` 与 `src/views/statistics/components/orderStatistics.vue` | 传入的 `overviewData` 从未被赋值，组件内也未见使用，属死参数 |

---

## 五、无后端对应（已裁剪）的功能清单

> 后端确实没有对应能力、已在前端裁剪掉的功能。以下为已经确定下来的取舍。

### 5.1 完全无对应后端端点（7 个函数）

| 编号 | 前端函数与前端路径 | 所在文件 | 有无活跃调用点 | 处置 |
|---|---|---|---|---|
| G1 | `getInformData`，`GET /messages/page` | `src/api/inform.ts` | 无（仅 import 未见调用） | 后端无消息端点，已随站内消息功能移除 |
| G2 | `getCountUnread`，`GET /messages/countUnread` | `src/api/inform.ts` | 有（顶栏未读数） | 已随顶栏未读数功能移除 |
| G3 | `batchMsg`，`PUT /messages/batch` | `src/api/inform.ts` | 无 | 已移除 |
| G4 | `setStatus`，`PUT /messages/{params}` | `src/api/inform.ts` | 无 | 已移除；注意勿与店铺模块 `src/api/users.ts` 的同名 `setStatus` 混淆 |
| G5 | `getDataOverView`，`GET /report/dataOverView` | `src/api/index.ts` | 无（仅 import 未见调用） | 已移除。如需数据概览，可改用 `GET /admin/workspace/overview/data`（须传 `date`），属功能重定向 |
| G6 | `editPassword`，`PUT /employee/editPassword` | `src/api/users.ts` | 有（修改密码） | 已随修改密码功能移除；后端未实现该能力，禁止凭外部教程猜测路径 |
| G7 | `commonDownload`，`GET /common/download` | `src/api/dish.ts` | 无（仅 import 未见调用） | 已移除；后端只有上传、无下载端点 |

> 依据：整个后端仓库检索 `messages` / `countUnread` 零命中，且管理端 9 个、用户端 8 个控制器中均无任何消息类控制器；`getDataOverView` 全仓库仅命中一个未被引用的类；`editPassword` 全仓库检索 `password` 零命中；`commonDownload` 检索 `download` 零命中。

### 5.2 仅「批量维度」无后端支持（2 项，函数本身可对齐）

| 编号 | 缺失什么 | 前端调用点 | 处置 |
|---|---|---|---|
| G8 | 菜品批量改状态无后端支持：后端只有单条端点 `PUT /admin/dishes/{id}/status` | 菜品列表的批量按钮 | 改为前端循环逐个调用单条端点 |
| G9 | 套餐批量改状态无后端支持：后端只有单条端点 `PUT /admin/setmeals/{id}/status` | 套餐列表的批量按钮 | 改为前端循环逐个调用单条端点 |

### 5.3 记录备查（非前端缺口）

| 编号 | 事项 | 结论 |
|---|---|---|
| N1 | 套餐「按分类查套餐」端点未暴露 | 该后端方法没有任何映射注解，不会注册为 HTTP 端点；前端未定义对应函数，不构成缺口 |
| N2 | 批量删除是「参数形式」而非「端点」缺口 | `DELETE /admin/dishes?ids=` 与 `DELETE /admin/setmeals?ids=` 后端有端点且声明 `List<Long>`，不属于功能缺口；逗号形式能否被接受需实测 |
| N3 | 接单缺少「漏传 id」兜底端点 | 后端为拒单 / 取消 / 派送 / 完成各写了兜底端点，唯独接单没有；前端不应依赖兜底行为，按正确写法拼 url 即可，不构成前端缺口 |
| N4 | 订单列表无「批量操作」能力 | 后端无批量接单 / 批量完成端点，前端也没有批量操作入口，双方一致，不是缺口 |

---

## 六、注意事项

> 以下为长期有效的技术事实与已知坑，改动相关代码前请先阅读。

1. **删除接口的 `ids` 参数形式**：`deleteDish` / `deleteSetmeal` 传的是逗号拼接字符串，后端声明 `@RequestParam List<Long> ids`。Spring 默认同时支持逗号分隔与重复同名参数两种绑定，本项目是否保留该行为需实测；若逗号形式不被接受，改为传数组（axios 默认会序列化为重复同名参数 `ids=1&ids=2`）。
2. **`DishFlavor.value` 的格式**：前端提交时对口味的 `value` 做 `JSON.stringify`，后端实体注释写的是 `list.toString` 形式。二者是否一致需实测（新增一个含口味的菜品后，再打开编辑看口味能否正确回填）。
3. **时间格式**：向 `LocalDateTime`（JSON 请求体）传值用 `yyyy-MM-dd HH:mm`（无秒）；展示后端返回时间按无秒处理；报表、工作台统一传 `yyyy-MM-dd`。订单查询参数 `beginTime` / `endTime` 的时间格式无法从源码断言（该查询 DTO 未标注 `@DateTimeFormat`），需实测（用「空格分隔 + 带秒」与 ISO 两种格式各试一次，看返回 `code`）。
4. **报表销量统计的排序方向**：`GET /admin/report/sales-statistics` 的返回是否已按销量降序未核实，消费侧是否需要 `reverse` 需实测。
5. **导出接口返回文件流**：`exportInfor`（`GET /admin/report/export`）返回 Excel 文件流（非 JSON），**成功判定不能靠 `code === 1`**；且必须传 `begin` / `end`（必填），否则后端返回的是 JSON 错误体而不是文件。当前实现已按此做防御（`src/views/statistics/components/titleIndex.vue`）：判断响应 `blob.type` 是否包含 `json`，是则读文本解析 `msg` 并报错，否则才触发下载。
6. **下载文件名**：后端 `Content-Disposition` 未使用 `filename*`、未声明字符集，且后端未配置 CORS，跨源时 JS 读不到该响应头；跨源场景前端只能自行指定文件名。
7. **图片上传**：`<el-upload>` 的 `action` 不走 axios 拦截器，需自行带对前缀或由代理覆盖；当前实现已由计算属性 `uploadAction` 按 `businessType` 分别指向 `POST /admin/files/dish` 与 `POST /admin/files/setmeal`，并自带 `/api` 前缀；表单字段名 `file`。
8. **实时消息（WebSocket）**：`VUE_APP_SOCKET_URL` 开发期为 `ws://localhost:8080/ws/`、生产期为 `ws://localhost/ws/`（由 nginx 在 80 端口代理 `/ws/`），需按部署环境核对；握手无鉴权；只接收、不向服务端发送。
9. **员工性别取值**：后端 `sex` 只接受 `1`（男）/ `2`（女），**没有 `0`**；提交与回填都要按 `1` / `2` 映射（曾出现把「女」映射为 `0` 导致校验失败或回显为「男」）。
10. **批量改状态需要前端循环**：后端只提供单条端点（`PUT /admin/dishes/{id}/status`、`PUT /admin/setmeals/{id}/status`），批量操作需在前端循环逐个调用。
11. **后端未返回的展示字段**：分类分页项无 `status`、`updateTime`；菜品详情 `DishVO` 无 `status`、`updateTime`；菜品列表项 `DishListItemVO` 无 `image`；订单列表项 `OrderPageQueryItemVO` 的 `tablewareNumber`、`consignee` 被注释掉。消费这些字段会得到空值，相关列 / 控件需按后端实际返回裁剪。
12. **金额与数值字段的空值兜底**：订单等列表的金额 / 数值字段可能为空，展示前需做空值兜底，避免渲染中断或显示异常。
13. **图表（ECharts）数据字段**：报表 4 个取数接口的响应已由「逗号分隔字符串」改为「对象数组」，消费侧需按对象数组映射字段；若仍按旧字段处理（例如对已不存在的字段调用 `.split`）会抛 `TypeError`，导致图表整块空白。数据点与数值标签的可见性已在各图表配置中修正：折线图设 `showSymbol: true`（`symbolSize: 10`），销量排行柱状图设数值标签（`label.show: true`，`formatter: '{c}'`）。
14. **订单状态动作路径的三个易错点**：取消是单 `l` 的 `cancelation`；接单是 `acceptance`（不是 `confirm`）；请求体不能放 `id`（`id` 走路径）。
15. **后端「漏传 id 兜底端点」**：拒单 / 取消 / 派送 / 完成各有一个不带 `id` 的兜底端点，恒返回失败 `{"code":0,...}`，前端不应主动调用；接单没有对应兜底端点。
