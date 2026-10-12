#!/usr/bin/env bash
# ============================================================================
# 在【本机（开发机）】上执行：把开发库整体导出成一份 SQL 备份。
#
# 用法：
#   ./dump-local-db.sh [输出目录]        # 默认输出到 /d/tmp/sky-deploy
#
# 说明：
#   - 开发库监听 127.0.0.1:3307，库名 sky_take_out；
#   - 导出文件包含真实业务数据，务必放在仓库之外，切勿提交进任何仓库；
#   - 若本机没有 mysqldump 命令（而 3307 是这个 MySQL 容器提供的），
#     可改用容器内的 mysqldump：先 docker ps 查到容器名，再 docker exec <容器> mysqldump ...
#     参数与下面完全一致。
#
# 常见报错与对策（按需在下面命令后追加）：
#   - Unknown table 'COLUMN_STATISTICS'  -> 追加 --column-statistics=0
#   - 权限不足（缺少 PROCESS 权限）       -> 追加 --no-tablespaces
# ============================================================================
set -euo pipefail

OUT_DIR="${1:-/d/tmp/sky-deploy}"
DB=sky_take_out
STAMP="$(date +%Y%m%d)"
OUT_FILE="${OUT_DIR}/${DB}_${STAMP}.sql"

mkdir -p "${OUT_DIR}"

echo ">>> 导出 ${DB}（127.0.0.1:3307）到 ${OUT_FILE} ..."
echo ">>> 按提示输入 MySQL root 口令。"
mysqldump -h 127.0.0.1 -P 3307 -u root -p \
  --default-character-set=utf8mb4 \
  --single-transaction \
  --set-gtid-purged=OFF \
  --databases "${DB}" \
  > "${OUT_FILE}"

echo ">>> 完成：${OUT_FILE}"
echo ">>> 下一步：把该文件与镜像包一起传上服务器（见 deploy/README.md）。"
