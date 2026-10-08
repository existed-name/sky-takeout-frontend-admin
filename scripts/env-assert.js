#!/usr/bin/env node
/**
 * 环境前置断言脚本（Step 0）
 *
 * 作用：确保本工程的构建始终运行在 Node 16.20.2 下。
 * 背景：nvm 只在 Git Bash 内可用，新开一个 shell 会回到默认的 Node 22，
 *       而本工程唯一验证过的工具链是「Node 16.20.2 + @vue/cli-service@3.12.1」。
 *       因此在执行任何构建类命令前，先跑本脚本做一次硬断言，不满足立即失败。
 *
 * 用法：node scripts/env-assert.js（已挂到 package.json 的 env:check，
 *       并被 serve / build 两个脚本以前置命令形式调用）
 */
'use strict';

// 本工程唯一允许的 Node 版本（含前缀 v，与 process.version 格式一致）
var expectedVersion = 'v16.20.2';
var currentVersion = process.version;

if (currentVersion !== expectedVersion) {
  console.error('【环境断言失败】当前 Node 版本为 ' + currentVersion + '，本工程要求 ' + expectedVersion + '。');
  console.error('请在 Git Bash 中先切换到正确版本再重试：nvm use 16.20.2');
  process.exit(1);
}

console.log('【环境断言通过】当前 Node 版本为 ' + currentVersion + '。');
process.exit(0);
