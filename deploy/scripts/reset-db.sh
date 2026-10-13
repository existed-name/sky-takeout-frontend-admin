#!/usr/bin/env bash
# ============================================================================
# 在【服务器】上执行：一键把数据库重置到指定备份的状态。
#
# 用法：
#   ./reset-db.sh <sql 文件路径>
#
# 必须显式传入 SQL 文件路径（不带参数直接退出），避免误触删库。
#
# 基线（恢复到哪个状态）由调用者决定，两种常见选择：
#   1) sql/sky_take_out_<部署日期>.sql  —— 回到部署当天的数据（推荐，这才是一键重置的通常含义）；
#   2) 用后端仓库 db/ 下的三个 SQL 拼一份「空业务库」（只有种子数据，无订单），适合演示环境。
#
# 执行内容：停后端 -> 删库重建 -> 重新导入 -> 起后端 -> 打印表数量。
# ============================================================================
set -euo pipefail

SQL_FILE="${1:-}"
if [ -z "${SQL_FILE}" ] || [ ! -f "${SQL_FILE}" ]; then
  echo "用法：$0 <sql 文件路径>" >&2
  echo "示例：$0 /opt/sky-deploy/sql/sky_take_out_20261010.sql" >&2
  exit 1
fi

CONTAINER=sky-takeout-mysql
DB=sky_take_out
BASENAME="$(basename "${SQL_FILE}")"
COMPOSE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo ">>> 1/5 停后端容器（避免重置过程中有请求写库）"
(cd "${COMPOSE_DIR}" && docker compose stop sky-takeout-backend) || true

echo ">>> 2/5 删库并重建（按提示输入 MySQL root 口令）"
docker exec -it "${CONTAINER}" \
  mysql -u root -p --default-character-set=utf8mb4 \
  -e "DROP DATABASE IF EXISTS ${DB}; CREATE DATABASE ${DB} DEFAULT CHARACTER SET utf8mb4;"

echo ">>> 3/5 导入备份 ${BASENAME}"
docker cp "${SQL_FILE}" "${CONTAINER}:/tmp/${BASENAME}"
docker exec -it "${CONTAINER}" \
  mysql -u root -p --default-character-set=utf8mb4 -e "source /tmp/${BASENAME}"

echo ">>> 4/5 重新启动后端容器"
(cd "${COMPOSE_DIR}" && docker compose start sky-takeout-backend)

echo ">>> 5/5 核验：表清单与关键表行数"
docker exec -it "${CONTAINER}" \
  mysql -u root -p --default-character-set=utf8mb4 \
  -e "use ${DB}; show tables; select count(*) as employee_rows from employee; select count(*) as operation_log_rows from operation_log;"
