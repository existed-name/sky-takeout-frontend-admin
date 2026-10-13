#!/usr/bin/env bash
# ============================================================================
# 在【服务器】上执行：把一份 SQL 备份导入 sky-takeout-mysql 容器。
#
# 用法：
#   ./import-db.sh <sql 文件路径>
#
# 说明：
#   - 口令用交互方式输入（不会出现在命令历史里）；
#   - 导入是【覆盖式】的（dump 里带 DROP TABLE IF EXISTS），会清掉库里已有数据，
#     所以只在首次部署或刻意重置时使用；
#   - 导出与导入两侧都显式使用 utf8mb4，避免中文乱码。
# ============================================================================
set -euo pipefail

SQL_FILE="${1:-}"
if [ -z "${SQL_FILE}" ] || [ ! -f "${SQL_FILE}" ]; then
  echo "用法：$0 <sql 文件路径>" >&2
  exit 1
fi

CONTAINER=sky-takeout-mysql
BASENAME="$(basename "${SQL_FILE}")"

echo ">>> 拷贝 ${BASENAME} 到容器 ${CONTAINER}:/tmp/ ..."
docker cp "${SQL_FILE}" "${CONTAINER}:/tmp/${BASENAME}"

echo ">>> 导入（按提示输入 MySQL root 口令）..."
docker exec -it "${CONTAINER}" \
  mysql -u root -p --default-character-set=utf8mb4 -e "source /tmp/${BASENAME}"

echo ">>> 核验：表清单与关键表行数"
docker exec -it "${CONTAINER}" \
  mysql -u root -p --default-character-set=utf8mb4 \
  -e "use sky_take_out; show tables; select count(*) as employee_rows from employee; select count(*) as operation_log_rows from operation_log;"
