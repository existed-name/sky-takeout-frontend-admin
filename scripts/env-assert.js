#!/usr/bin/env node
/**
 * 环境前置断言脚本（Step 0）
 *
 * 作用：检查当前 Node 版本是否适合构建本工程；版本不理想时只提示、不阻断。
 *
 * 版本策略（2026-10-08 调整）：
 *   - 推荐（基准）版本：Node 16.20.2。本工程的产物一致性基准就是它，命中即放行。
 *   - 其它版本：默认放行（退出码 0），仅打印提示。理由见下。
 *   - 仅当 Node 主版本过低、Vue CLI 3 / webpack 4 工具链根本起不来时才失败（退出码 1）。
 *
 * 为什么不再硬拦（旧行为是「非 v16.20.2 一律退出码 1」）：
 *   1. 「能否跑通」与 Node 版本无关——已实测 Node 22.20.0 能构建成功（退出码 0），
 *      且不需要 NODE_OPTIONS=--openssl-legacy-provider（该开关在本工程是空操作）；
 *   2. 实测 Node 16 与 Node 22 产出的 12 个产物文件「字节完全相同」；
 *   3. 本工程要分发给其他人、在别人的机器上跑，对方装的是哪个 Node 版本无法预设，
 *      一上手就被自己的守卫拦死，是最大的使用障碍。
 *
 * 为什么还保留推荐版本的提示：
 *   唯一实质差异在「产物文件名里的哈希段」——Node 16 与 Node 22 有 6 个产物的文件名哈希不同。
 *   根因：webpack 4.47 的哈希实现按 Node 大版本分叉，其在主版本 >= 18 时启用的内置
 *   WASM md4 对非 ASCII 字符串有缺陷（把字符数当字节数），而本工程源码含大量中文
 *   （品牌名、页面文案），导致 chunkhash 漂移；文件内容本身不受影响。
 *   实测：Node 14 / 16 的产物文件名哈希一致（主版本 < 18 走原生 md4），Node 18 及以上才漂移。
 *   因此换到 18+ 之后，任何「按文件名 / 哈希与基准逐字节比对」的验收都会翻车，
 *   但并不影响功能，所以在提示里说清楚，让「需要复现基准产物」的人自己切回 16.20.2。
 *   （构建日志里那 49 条 Dart Sass 弃用警告与 Node 版本无关——基准版本同样会输出，
 *    属 sass 1.79 旧 JS API 的固有现象，不作为偏好基准版本的理由。）
 *
 * 最低版本阈值（14）的依据（逐包核对 engines.node 后取「构建链上的最高下限」，非拍脑袋）：
 *   - @vue/cli-service@3.12.1     engines.node = ">=8"
 *   - webpack@4.47.0              engines.node = ">=6.11.5"
 *   - sockjs-client@1.6.1         engines.node = ">=12"        （开发服务器链路）
 *   - eventsource@2.0.2           engines.node = ">=12"        （开发服务器链路）
 *   - sass@1.79.0（Dart Sass）     engines.node = ">=14.0.0"    ← 真正的下限
 *   扫描 node_modules 中全部 592 个带 engines.node 的包后，构建期依赖里下限最高者为
 *   sass 的 14，故取 14 作为硬门槛；低于它的工具链会在 Dart Sass 处不可用。
 *   （另：node-releases@2.0.57 声明 ">=18"，但它只被 browserslist 以 JSON 数据路径引用、
 *     不加载其代码，且 Node 16 构建已实测通过，故不作为阈值依据。）
 *
 * 附带说明：Node 17 属于「能启动、但构建会失败」的版本——webpack 4.47 只在主版本 >= 18 时
 *   才启用内置 WASM md4，17 会落到 crypto.createHash('md4')，而 Node 17 起 OpenSSL 3
 *   已移除 md4，会抛 error:0308010C:digital envelope routines::unsupported。
 *   按「默认放行」策略，17 仍然放行，但会额外提示其应对办法。
 *
 * 用法：node scripts/env-assert.js（已挂到 package.json 的 env:check，
 *       并被 serve / build 两个脚本以前置命令形式调用）
 */
'use strict';

// 推荐（基准）版本，含前缀 v，与 process.version 格式一致
var recommendedVersion = 'v16.20.2';
// 硬门槛：Node 主版本低于此值时，Vue CLI 3 / webpack 4 工具链无法运行（依据见文件头注释）
var minimumMajorVersion = 14;

var currentVersion = process.version;
var currentMajorVersion = parseInt(currentVersion.slice(1), 10);

// 版本号解析异常时按最宽松处理：只提示、不拦截，避免守卫本身成为障碍
if (isNaN(currentMajorVersion)) {
  console.warn('【环境提示】无法识别当前 Node 版本号：' + currentVersion + '，已默认放行。');
  process.exit(0);
}

if (currentMajorVersion < minimumMajorVersion) {
  console.error('【环境断言失败】当前 Node 版本为 ' + currentVersion + '，本工程要求 Node 主版本不低于 ' + minimumMajorVersion + '。');
  console.error('原因：构建链依赖 Dart Sass 1.79（要求 Node >= 14）以及 Vue CLI 3 / webpack 4，低于该版本无法运行。');
  console.error('请升级到 Node 16.20.2（推荐/基准版本），或任意 Node 14 及以上的更高版本。');
  process.exit(1);
}

if (currentVersion === recommendedVersion) {
  console.log('【环境断言通过】当前 Node 版本为 ' + currentVersion + '（推荐/基准版本）。');
  process.exit(0);
}

// 非推荐版本：默认放行，但把可用性与差异讲清楚
console.log('【环境提示】当前 Node 版本为 ' + currentVersion + '，可以正常构建和运行，已放行。');
console.log('  推荐（基准）版本：' + recommendedVersion + '。');
console.log('  其它 Node 版本同样能构建运行；与基准版本的实质差异只有一点，且不影响功能：');
console.log('    产物文件名里的哈希段可能与基准不一致——webpack 4.47 的哈希实现按 Node 大版本分叉，');
console.log('    其主版本 >= 18 时启用的内置 WASM md4 对中文等非 ASCII 字符串有缺陷，导致 chunkhash 漂移；');
console.log('    产物文件内容本身完全相同，页面行为一致（实测 Node 14 / 16 哈希一致，18 及以上才漂移）。');
console.log('  补充：构建日志里的约 49 条 Dart Sass 弃用警告与 Node 版本无关（基准版本同样会输出），');
console.log('        此处一并说明，以免被误判为版本不匹配。');
console.log('  如果需要与基准产物做「逐文件名 / 逐字节」比对，请改用 ' + recommendedVersion + '。');
if (currentMajorVersion === 17) {
  console.log('  另注：Node 17 上 webpack 4.47 会退回 OpenSSL 3 已移除的 md4，构建可能报 error:0308010C；');
  console.log('       请改用 ' + recommendedVersion + '，或在命令前加 NODE_OPTIONS=--openssl-legacy-provider。');
}
process.exit(0);
