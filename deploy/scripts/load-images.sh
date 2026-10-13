#!/usr/bin/env bash
# ============================================================================
# 在【服务器】上执行：载入镜像包，并打印已载入的镜像与当前容器状态。
#
# 用法：
#   ./load-images.sh [镜像包路径]        # 默认 /opt/sky-images-1.0.0.tar
#
# 说明：镜像包由本机 docker save 生成（见 deploy/README.md 的「C. 构建镜像（本机）」一节），
#       通常已经一并传成 .tar.gz，本脚本会先解压再 docker load。
# ============================================================================
set -euo pipefail

TARBALL="${1:-/opt/sky-images-1.0.0.tar}"

if [ ! -f "${TARBALL}" ] && [ -f "${TARBALL}.gz" ]; then
  echo ">>> 解压 ${TARBALL}.gz ..."
  gunzip -kf "${TARBALL}.gz"
fi

if [ ! -f "${TARBALL}" ]; then
  echo "找不到镜像包：${TARBALL}" >&2
  exit 1
fi

echo ">>> 载入镜像：${TARBALL}"
docker load -i "${TARBALL}"

echo ">>> 已载入的镜像（应看到 sky-takeout-backend 与 sky-takeout-frontend-admin）"
docker images | grep '^sky-takeout-' || true

echo ">>> 当前容器状态"
cd "$(dirname "$0")/.."
docker compose ps
