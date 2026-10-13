# 管理端部署物料说明

本目录是「苍穹外卖 · 管理端前端」的云服务器部署物料。目标：在一台云主机上用一套
`docker compose` 同时跑起 **前端页面（nginx）+ 后端 + MySQL + Redis** 四件事，
只有 nginx 对公网发布 80 端口。

> 面向公网 IP 直接访问，不使用域名、暂不启用 HTTPS。安全组只放行 22（SSH）与 80（HTTP）。

---

## 一、本目录里有什么

| 文件 | 作用 |
| --- | --- |
| `docker-compose.yml` | 编排四个服务。只用 `image:` 引用镜像，不写 `build:`（后端镜像在另一个仓库单独构建）。 |
| `Dockerfile.frontend` | 前端镜像：容器内用 `node:16.20.2` 构建，再用 `nginx:1.27-alpine` 托管产物。构建上下文是**前端仓库根目录**。 |
| `nginx/default.conf` | 站点配置，以只读方式挂进 nginx 容器（改配置不用重建镜像）。 |
| `.env.example` | 环境变量模板，只列键名、值留空。 |
| `.env` | 真实变量与口令（**不入库**）。本仓库已生成一份本机试跑用 `.env`（不入库）；如需重建，`cp .env.example .env` 后按注释填写。 |
| `scripts/dump-local-db.sh` | 在**本机**执行：把开发库导出成 SQL 备份。 |
| `scripts/load-images.sh` | 在**服务器**执行：载入镜像包并打印容器状态。 |
| `scripts/import-db.sh` | 在**服务器**执行：把 SQL 备份导入 MySQL 容器。 |
| `scripts/reset-db.sh` | 在**服务器**执行：一键把数据库重置到指定备份。 |

另外，前端仓库**根目录**还有一份 `.dockerignore`，用于在前端镜像构建时挡掉 `node_modules`、
`dist`、`dist-sky`、`draft`、`.env*` 等，避免它们进入构建上下文。

---

## 二、运行架构速览

```
访问者浏览器
     │  http://<公网IP>/
┌────▼──────────────────────────────────────────────────────────┐
│ 云主机（Docker + docker compose）                             │
│  docker 网络 sky-takeout-net（仅容器之间互通）                │
│                                                               │
│  sky-takeout-frontend-admin 容器 —— 发布 80:80（唯一对外端口）│
│    /       → 前端静态产物                                     │
│    /api/   → sky-takeout-backend:8080/admin/（路径重写）      │
│    /ws/    → sky-takeout-backend:8080/ws/（WebSocket 升级）   │
│    /user/  → sky-takeout-backend:8080（直通，用户端接口调试） │
│                │                                              │
│  sky-takeout-backend 容器（8080，不发布端口）                 │
│       ├──▶ sky-takeout-mysql 容器（3306，不发布端口）         │
│       └──▶ sky-takeout-redis 容器（6379，不发布端口，带口令） │
└───────────────────────────────────────────────────────────────┘
```

**只有 nginx 发布端口**；后端、MySQL、Redis 一律不写 `ports:`，只在容器内网用服务名互访。
这样「数据库/缓存不暴露到公网」是结构上的保证，而不是靠安全组配置是否写对。

> Web 用户端是**独立容器、独立端口、自带 nginx 站点**（静态托管 + `/user/` 反向代理），
> 不复用管理端这份 nginx。因此这里**没有** `location /web/`；图中的 `location /user/`
> 仅用于从管理端端口直接打用户端接口做调试，两端反向代理的是同一个后端。

---

## 三、本机试跑（上服务器之前先跑一遍）

上服务器之前，先用同一套物料在本机把整条链路跑通：能提前暴露 `.env` 缺项、镜像引用不对、
端口冲突等问题。流程与服务器基本一致，只是省掉了「打包传输」和「导入备份」两步。

1. **先启动 Docker Desktop**，确认守护进程在跑（`docker version` 能看到 Server 段）。
   本机与服务器跑的是同一份 compose，物料无需任何改动。

2. 在**本机构建两个镜像**（tag 与服务器上用的完全一致）：

   ```bash
   # 前端镜像：在本仓库根目录执行
   docker build -f deploy/Dockerfile.frontend -t sky-takeout-frontend-admin:1.0.0 .
   # 后端镜像：在后端仓库根目录执行
   docker build -t sky-takeout-backend:1.0.0 .
   ```

3. 准备 `deploy/.env`。本仓库已生成一份本机试跑用 `deploy/.env`（不入库），可直接使用；
   如需重建，`cp .env.example .env` 后按注释填写。取值与服务器**完全一样**：
   MySQL 主机填 `sky-takeout-mysql`、端口填 `3306`；Redis 主机填 `sky-takeout-redis`、端口填 `6379`。
   这里填的是 compose 服务名（容器之间按服务名互访），本机与服务器没有差别，所以本机那套 `.env`
   可以直接带到服务器上用。

4. 在 `deploy/` 目录执行 `docker compose up -d`，然后浏览器打开 `http://localhost/`。
   站点发布在容器的 80 端口上，本机直接访问即可（若本机 80 已被别的服务占用，可临时把
   `docker-compose.yml` 的端口映射改成如 `"9080:80"`，验证完改回**并确认这一行没有被带到服务器上**）。

5. **连容器里的数据库**：MySQL / Redis 都**不发布端口**，宿主机连不上，需进容器操作，例如
   `docker compose exec sky-takeout-mysql mysql -u root -p`。库是空的话，可先按「部署步骤 E / H」
   导出并导入一份数据备份，页面才有内容可看。

> 数据落在具名卷 `sky-takeout-mysql-data` 上；`docker compose down` 保留数据，加 `-v` 才会连数据一起删。

---

## 四、部署步骤（从拿到云主机到打开登录页）

> 命令按 **本机 Git Bash + 服务器 bash** 编写。`<公网IP>`、`<日期>` 等按实际替换。

### A. 云主机准备

1. 购买云主机：**2 核 4G、系统盘 ≥ 40 GB、Ubuntu 22.04 或 24.04 LTS 64 位、带宽 ≥ 3 Mbps**。
   *在做什么*：这是「nginx + 后端 + MySQL + Redis 同机运行」的最低舒适规格；带宽给足是因为首屏要拉约 1.5 MB 的 JS/CSS（图片走对象存储，不占服务器带宽）。
2. 安全组：**只放行 22 与 80**；3306 / 6379 / 8080 **不要放行**。
3. 首次登录并做基础设置：

```bash
ssh root@<公网IP>
apt update && apt upgrade -y
timedatectl set-timezone Asia/Shanghai     # 宿主机时区与容器对齐
```

### B. 安装 Docker 与 docker compose（服务器）

```bash
curl -fsSL https://get.docker.com | sh        # 官方脚本：装 docker 引擎 + compose v2 插件
systemctl enable --now docker                 # 开机自启（重启后容器才会自动回来）
docker --version && docker compose version    # 两条都要有输出
```

*在做什么*：装 Docker 引擎与 `docker compose`（v2，`docker compose` 子命令形式）。
本方案用到 `depends_on: condition: service_healthy` 的写法，**需要 compose v2**。
若用发行版仓库装出来的 `docker-compose` 是 v1，请改用阿里云的 Docker CE 安装源，
再执行 `apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin`。

### C. 构建镜像（本机）

在前端仓库根目录构建前端镜像：

```bash
cd <前端仓库根目录>
docker build -f deploy/Dockerfile.frontend -t sky-takeout-frontend-admin:1.0.0 .
```

后端镜像由**后端仓库根目录**的 `Dockerfile` 单独构建（两个是独立的 git 仓库，
所以 compose 里只用 `image:` 引用，不写跨仓库的 `build:`）：

```bash
cd <后端仓库根目录>
docker build -t sky-takeout-backend:1.0.0 .
```

把两个镜像打成一个包，便于一起传上服务器：

```bash
cd /d/tmp/sky-deploy
docker save -o sky-images-1.0.0.tar sky-takeout-frontend-admin:1.0.0 sky-takeout-backend:1.0.0
gzip -k sky-images-1.0.0.tar          # 生成 .tar.gz，体积约减到 1/3
```

*在做什么*：在**本机构建**再到服务器 `docker load`。这样服务器不需要 Node / Maven 工具链，
也不依赖服务器访问外网下载依赖，离线可复现。每次重新构建请**递增 tag**（如 1.0.1），不要复用旧 tag。

### D. 准备 `.env`（本机）

```bash
cd <前端仓库根目录>/deploy
cp .env.example .env
# 用编辑器按 .env 里每行的注释填写取值：
#   取值来源是本机后端配置文件 application-dev.yml；
#   只有连接地址需要改：MySQL 主机改 sky-takeout-mysql、端口改 3306，Redis 主机改 sky-takeout-redis；
#   标注「密钥」的项建议换成新值；口令请用新的强口令。
```

*在做什么*：把连接信息与各类密钥集中到一个文件里。该文件既供 compose 做变量插值，
又通过 `env_file` 注入容器，因此**明文密钥不会进镜像、也不会进 git**。
注意后端需要的 `sky.*` 变量共 **24 个**，一个都不能少，否则后端启动会报
`Could not resolve placeholder 'sky.xxx'`。

### E. 导出数据备份（本机）

```bash
cd <前端仓库根目录>/deploy
./scripts/dump-local-db.sh /d/tmp/sky-deploy
# 产出形如 /d/tmp/sky-deploy/sky_take_out_<日期>.sql
```

*在做什么*：以本机开发库为准整体导出（含真实业务数据，也就同时覆盖了建表结构）。
导出文件放在仓库之外，**切勿提交进任何仓库**。

### F. 建立部署目录并上传物料（本机 → 服务器）

```bash
# 上传部署目录（首次部署：服务器上 /opt/sky-deploy 尚不存在时执行）
cd <前端仓库根目录>
scp -r deploy root@<公网IP>:/opt/sky-deploy

# 上传镜像包与数据备份（先 cd 进目录、用相对文件名，避免 scp 把 "D:" 当成主机名）
cd /d/tmp/sky-deploy
scp sky-images-1.0.0.tar.gz sky_take_out_<日期>.sql root@<公网IP>:/opt/
```

*在做什么*：把 compose 文件、nginx 配置、脚本、`.env`、镜像包、数据备份都送到服务器。
注意：
- 如果 `/opt/sky-deploy` **已经存在**（重复上传），scp 会把它复制成 `/opt/sky-deploy/deploy/`，
  此时应改用 `scp -r deploy/. root@<公网IP>:/opt/sky-deploy/`。
- `scp -r deploy` 会连同本机 `.env` 一起传上去（这是刻意的，省得在服务器上手改）；传完记得 `chmod 600`。

### G. 服务器：放好物料、载入镜像

```bash
chmod 600 /opt/sky-deploy/.env
mkdir -p /opt/sky-deploy/sql
mv /opt/sky_take_out_<日期>.sql /opt/sky-deploy/sql/

cd /opt/sky-deploy
./scripts/load-images.sh /opt/sky-images-1.0.0.tar
# 应看到 sky-takeout-backend 与 sky-takeout-frontend-admin 两个镜像
```

### H. 服务器：先起数据库并导入数据

```bash
cd /opt/sky-deploy
docker compose up -d sky-takeout-mysql    # 只先起数据库
docker compose ps                         # 等 sky-takeout-mysql 变成 healthy（首次约 30~60 秒）
./scripts/import-db.sh sql/sky_take_out_<日期>.sql
```

*在做什么*：MySQL 容器只在**数据目录为空**时执行初始化（建库、建应用账号），
所以必须先起来、再导入。导入完成后核验：表在、`employee` 与 `operation_log` 有数据。

### I. 服务器：起其余服务

```bash
cd /opt/sky-deploy
docker compose up -d               # 起 nginx + 后端 + Redis（mysql 已在跑）
docker compose ps                  # 四个容器都应为 running / healthy
docker compose logs --tail=100 sky-takeout-backend    # 看到 "Started SkyApplication in x seconds" 才算起好
curl -I http://localhost/          # 本地自测：应返回 200 与 text/html
```

*在做什么*：一次性拉起全部服务。后端启动约 20~40 秒。
若日志出现 `Could not resolve placeholder` 或 `Communications link failure`，见下方「排查」。

### J. 浏览器验收

打开 `http://<公网IP>/`，用员工账号登录，然后按下一节清单逐条检查。

---

## 五、验收清单

> 全部在**公网 IP + 真实浏览器**上做。带 **写库** 标记的步骤请只在云库上做。

### 基础链路

| # | 检查项 | 期望现象 |
| --- | --- | --- |
| 1 | 打开 `http://<公网IP>/` | 出现登录页；F12 → Network 里 css/js/字体/图标全部 200，无 404 |
| 2 | 登录 | 输入账号口令后进入首页 |
| 3 | 首页/工作台 | 有数字、有图表（说明 MySQL 连通且数据已导入） |
| 4 | 任选列表页（菜品/套餐/分类/员工/订单） | 列表有数据、分页正常 |
| 5 | 刷新页面（F5）、直接粘贴 `http://<公网IP>/#/dish` | 都能正常打开 |
| 6 | 浏览器 Application → Service Workers | **应为空**（若发现旧的 service worker，点 Unregister 并强刷） |

### 容易漏的三条链路

| # | 检查项 | 期望现象 |
| --- | --- | --- |
| 7 | 实时提醒（WebSocket） | 见下面「WebSocket 三步验证」 |
| 8 | 图片上传（对象存储）**（写库）** | 新增菜品 → 上传图片 → 立刻能看到图片 |
| 9 | 导出报表 | 统计页选区间 → 导出 → 浏览器下载到能正常打开、中文名正确的 `.xlsx` |

另外顺手过一遍：顶栏「营业状态设置」改一次再刷新能保持；统计页四个图（营业额/用户量/订单/销量）
的数据点与数值标签都有。

### WebSocket 三步验证（不写库）

1. **握手成功**：打开任一管理端页面，F12 → Console 应打印 `浏览器WebSocket已打开`。
   若弹出「服务器错误，无法接收实时报警信息」，说明 WebSocket 没通。
2. **长时间保持（专项）**：在 Console 执行：

   ```js
   const w = new WebSocket('ws://' + location.host + '/ws/probe')
   w.onopen = () => console.log('open')
   w.onclose = e => console.log('closed', e.code)
   ```

   保持页面开着 **5 分钟以上**，然后回来看：**不能出现 `closed`**。
   出现 `closed` 说明 nginx 的超时没配好（见 `nginx/default.conf` 的 `/ws/` 段）。
3. **全链路推送（写库，需要用户端配合）**：用户端提交一个订单，管理端页面应弹窗 + 响铃。

### 安全与运维

| # | 检查项 | 期望 |
| --- | --- | --- |
| 10 | 从本机 `telnet <公网IP> 3306` 与 `6379` | **连不上** |
| 11 | `docker compose ps` 的端口列 | 只有 nginx 有 `0.0.0.0:80->80/tcp` |
| 12 | 镜像里不含明文密钥：`docker cp sky-takeout-backend:/app/app.jar /tmp/app.jar` 后 `unzip -l /tmp/app.jar \| grep application-dev` | 输出「未发现」 |
| 13 | `reboot` 后等 2 分钟再打开页面 | 四个容器自动回来 |
| 14 | `df -h` 与 `docker system df` | 磁盘使用 < 70% |

---

## 六、常见问题排查

```bash
cd /opt/sky-deploy
docker compose ps                              # 四个容器状态 / 端口 / 健康
docker compose logs --tail=200 sky-takeout-backend     # 看后端日志
docker compose logs --tail=100 sky-takeout-frontend-admin
docker compose exec sky-takeout-backend env | grep -c '^SKY_'   # 应为 24，少了就是 .env 缺项
docker exec sky-takeout-frontend-admin nginx -t                 # 校验 nginx 配置语法
curl -i http://localhost/api/dishes            # 从服务器内部直接打接口（未带 token 应返回 401 或业务失败 JSON）
```

- **后端起不来，日志报 `Could not resolve placeholder 'sky.xxx'`**：`.env` 缺项，补齐后 `docker compose up -d sky-takeout-backend`。
- **`Communications link failure` / `Access denied`**：确认 MySQL 已 healthy；确认 `SKY_DATASOURCE_HOST=sky-takeout-mysql`、端口 `3306`；确认应用账号口令与 `MYSQL_PASSWORD` 一致。注意 MySQL 口令只在数据卷首次初始化时生效，改 `.env` 后需重建数据卷或在库内 `ALTER USER`。
- **页面能开但接口全 401/404**：检查 `/api/` 是否被重写到了 `/admin/`（`docker compose exec sky-takeout-frontend-admin cat /etc/nginx/conf.d/default.conf | grep proxy_pass`）。
- **前端白屏 / 资源 404**：多半是挂载的 `root` 层不对或浏览器缓存了旧 `index.html`（`docker compose exec sky-takeout-frontend-admin ls /usr/share/nginx/html` 应直接看到 `index.html`、`css`、`js`），并 Ctrl+F5 强刷。
- **图片上传失败**：413 表示 `client_max_body_size` 太小；其它错误对照本机 `application-dev.yml` 的 OSS 四项逐字比对。
- **重建后端容器后页面 502**：nginx 会缓存后端容器 IP，`docker compose restart sky-takeout-frontend-admin` 即可。
- **长时间后不再弹提醒**：见上面 WebSocket 三步验证第 2 步；后端重启时前端会自动重连（`onclose` 后 5 秒重连一次），一般无需手动刷新页面。

---

## 七、更新与回滚

**日常更新**：本机重新构建镜像（tag 递增，如 1.0.1）→ `docker save` → 传服务器 → `docker load`
→ 改 `docker-compose.yml` 里的 tag → `docker compose up -d` → `docker compose restart sky-takeout-frontend-admin`。

**回滚（一级，最快）**：把 `docker-compose.yml` 里的 tag 改回上一个版本，`docker compose up -d`，
再 `docker compose restart sky-takeout-frontend-admin`。前提是服务器上保留了旧版本镜像。

**回滚（二级，连数据）**：`./scripts/reset-db.sh /opt/sky-deploy/sql/<备份>.sql`。

**回滚（三级，整机重来）**：`docker compose down`（**不要加 `-v`**，加 `-v` 会连数据卷一起删）
→ 重新 `docker load` → 重新导入 → `up -d`。

**必须长期保留的三样东西**：服务器上的 `deploy/.env`、`sql/` 目录下的备份、至少一个旧版本镜像。

**升级前建议先导出一次数据库**（把 `.env` 里的变量载入当前 shell 后导出）：

```bash
cd /opt/sky-deploy
set -a; . ./.env; set +a
docker compose exec -T -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" sky-takeout-mysql \
  mysqldump -u root --default-character-set=utf8mb4 --single-transaction --databases sky_take_out \
  > sql/before-upgrade-<日期>.sql
```
