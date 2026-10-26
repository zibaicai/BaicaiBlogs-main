# BaicaiBlogs 清理与权限任务台账

> 本文件只记录任务、决策和验收标准，不记录密码、token、数据库连接串。
> 外部备份目录：`E:\ServerResourceBackup`

## 已确认决策

- [x] 公开 GitHub 仓库执行历史重写，保留 commit message。
- [x] 当前 `admin` 保留为普通管理员，不升级。
- [x] 新建唯一 `SUPER_ADMIN`，用户名 `superadmin`。
- [x] 超级管理员密码由本任务生成，写入外部 `account.txt`。
- [x] `site_info.social` 公开字段仅 `github`、`gitee`。
- [x] 私有字段：`email`、`qq`、`wechat`、`google`。
- [x] 普通管理员查看敏感字段需要申请，审批有效期 1 小时。
- [x] `init.sql` 保留默认 `admin` 初始化账号。
- [x] `album_001` 保留，外部照片替换：封面 `/bg-4.webp`，照片 `/bg-1.webp`、`/bg-2.webp`。
- [x] `shell` 封面替换为 `/bg-3.webp`。
- [x] `welcome-to-baicaiblogs` 封面替换为 `/bg-3.webp`。
- [x] 友链头像替换为 `/avatar.jpg`。
- [x] `react-notes` 两张 Typora 本地图片不存在，删除对应 `<img>` 标签。
- [x] legacy 目录全部删除，旧根目录配置归档后删除。
- [x] `theme-demos/` 提交。
- [x] C 端默认资源使用相对 URL，管理端使用公开站点绝对 URL。
- [x] 图片没有可考作者，按网络来源记录在 `ASSETS.md`，后续补充出处。
- [x] MySQL 密码暂不轮换；需保持 3306 不对公网开放。
- [x] 外部备份排除 `node_modules`、`.next`、`dist`、`_deploy`、`_test`。

## 执行任务

### 备份与凭据

- [ ] CLEANUP-01 创建 `E:\ServerResourceBackup` 子目录。
- [ ] CLEANUP-02 创建 Git tag `legacy-before-cleanup`。
- [ ] CLEANUP-03 导出 Git bundle 到外部备份。
- [ ] CLEANUP-04 导出项目源码压缩包，排除依赖和构建产物。
- [ ] CLEANUP-05 导出 MySQL dump。
- [ ] CLEANUP-06 导出 OSS/图片引用清单。
- [ ] CLEANUP-07 创建 `E:\ServerResourceBackup\account.txt`，标注来源：
  - MySQL：`application-prod.yml:8-10`
  - Website admin：`README.md:77` / `init.sql:35-37`
  - SUPER_ADMIN：本次新建
- [ ] CLEANUP-08 生成随机强密码并创建唯一 `superadmin`，角色 `SUPER_ADMIN`。

### 默认凭据与初始化

- [ ] CLEANUP-09 删除 README / README_en 中的默认管理员密码。
- [ ] CLEANUP-10 保留 `init.sql` 默认 admin，但 README 不公开密码。
- [ ] CLEANUP-11 审计 `DataInitializer` 自动创建 admin 的行为，避免生产环境弱密码自动生成。
- [ ] CLEANUP-12 将 Git 历史中的 DB 密码和默认密码替换为占位符。

### 权限与隐私

- [ ] AUTH-01 新建唯一 SUPER_ADMIN，验证不存在第二个。
- [ ] AUTH-02 公开接口只返回 `github`、`gitee`。
- [ ] AUTH-03 公开接口禁止返回 `email`、`qq`、`wechat`、`google`。
- [ ] AUTH-04 公开接口禁止返回 `misc.picBedToken` 及连接凭据。
- [ ] AUTH-05 新增认证后的管理端完整配置接口。
- [ ] AUTH-06 普通 ADMIN 读取敏感字段时脱敏。
- [ ] AUTH-07 普通 ADMIN 申请查看 `site_social`，SUPER_ADMIN 审批。
- [ ] AUTH-08 审批有效期 1 小时，查看写审计日志。
- [ ] AUTH-09 管理端静态 bundle 移除私有默认值。
- [ ] AUTH-10 C 端只显示 github/gitee。
- [ ] AUTH-11 普通 ADMIN 隐藏隐私审计入口或显示无权限提示。

### 资源与 URL

- [ ] CLEANUP-13 提交 `apps/web/public/avatar.jpg`、`bg-1..5.webp`、`favicon.ico`。
- [ ] CLEANUP-14 C 端默认 URL 改相对路径。
- [ ] CLEANUP-15 管理端默认 URL 改公开站点绝对 URL。
- [ ] CLEANUP-16 新增 `ASSETS.md`，记录来源未知与待补出处。
- [ ] CLEANUP-17 删除未引用的 `siamese-cat.png` 或明确保留。

### Legacy 与脚本

- [ ] CLEANUP-18 删除 `my-blog-admin/`。
- [ ] CLEANUP-19 删除 `my-blog-admin-spa/`。
- [ ] CLEANUP-20 删除 `my-blog-public/`。
- [ ] CLEANUP-21 删除空 `picture/`、`scripts/checkConfig.mjs`、`update.*`。
- [ ] CLEANUP-22 归档后删除根目录 `start.bat`、旧 service/nginx 配置。
- [ ] CLEANUP-23 清理 `.gitignore` 中 legacy 规则。
- [ ] CLEANUP-24 修 `start.mjs`：安装失败立即退出。
- [ ] CLEANUP-25 修 `deploy.mjs`：未跟踪文件检查、dry-run、确认、备份保留、healthPaths。
- [ ] CLEANUP-26 增加 `rollback backend`。
- [ ] CLEANUP-27 修 `deploy/README.md` 字面量 `\n\n`。

### 数据库资源替换

- [ ] DB-01 `background.defaultPostCover` → `/bg-3.webp`
- [ ] DB-02 `misc.photoWallImage` → `/bg-4.webp`
- [ ] DB-03 `post:welcome` cover → `/bg-3.webp`
- [ ] DB-04 `post:shell` cover → `/bg-3.webp`
- [ ] DB-05 `album_001` cover → `/bg-4.webp`
- [ ] DB-06 `album_001` photo0 → `/bg-1.webp`
- [ ] DB-07 `album_001` photo1 → `/bg-2.webp`
- [ ] DB-08 `friend:amiya` avatar → `/avatar.jpg`
- [ ] DB-09 `react-notes` 删除两个失效 `<img>`
- [ ] DB-10 验证替换后 API 不返回外部 URL

### 验证与发布

- [ ] VERIFY-01 `npm run build` apps/web 通过。
- [ ] VERIFY-02 `npm run build` apps/admin 通过。
- [ ] VERIFY-03 `node --check deploy.mjs start.mjs` 通过。
- [ ] VERIFY-04 本地验证 `/avatar.jpg`、`/bg-1.webp`、`/favicon.ico`。
- [ ] VERIFY-05 预发验证首页、文章、说说、相册、后台设置、登录。
- [ ] VERIFY-06 验证普通 ADMIN 看不到私有 social。
- [ ] VERIFY-07 验证 SUPER_ADMIN 可见完整 social。
- [ ] VERIFY-08 验证申请/审批/过期/审计。
- [ ] DEPLOY-01 显式 stage 后提交。
- [ ] DEPLOY-02 Git 历史重写并 force push。
- [ ] DEPLOY-03 服务器仓库重新同步。
- [ ] DEPLOY-04 生产发布 C 端、管理端、后端环境变量。
- [ ] DEPLOY-05 C 端回滚演练。
- [ ] DEPLOY-06 管理端备份恢复演练。
- [ ] DEPLOY-07 数据库 dump 恢复演练记录。

## 禁止事项

- 不提交 `account.txt`。
- 不提交密码、token、数据库连接串。
- 不使用 `git add -A`，必须显式 stage。
- 不在未备份情况下删除 legacy。
- 不在公开仓库保留旧 DB 密码和个人信息。
- 不把靶场数据库和生产数据库混用。

---

## 执行进度（2026-10-26）

- [x] 外部备份目录、Git bundle、项目归档、MySQL dump、OSS 清单
- [x] account.txt（MySQL / admin / superadmin 来源与状态）
- [x] 创建唯一 `superadmin`，`admin` 调整为普通 ADMIN
- [x] README 移除默认密码
- [x] `application-prod.yml` 改为环境变量，服务器使用 `/etc/baicai/backend.env`
- [x] 删除 legacy 目录、旧根配置、旧截图和旧更新器
- [x] 提交新静态资源、`theme-demos`、`deploy.mjs`、`start.mjs`
- [x] 补 `ASSETS.md`
- [x] C 端默认资源相对 URL，管理端公开站点绝对 URL
- [x] 公开配置过滤 `email`、`qq`、`wechat`、`google`、`picBedToken`
- [x] 普通管理员敏感字段脱敏、申请、超级管理员审批 1 小时
- [x] 数据库替换外部图片与失效 Typora 图片引用
- [x] Git 历史重写：移除 legacy、旧截图、默认密码和旧 DB 密码
- [x] C 端和管理端最终构建
- [ ] 最新提交推送（当前网络重试中）
- [ ] 最终部署后完整验收与回滚演练

## 收尾结果（2026-10-26 18:45）

- [x] C 端最终构建并发布：`/opt/baicai-public/releases/20261026-1845`
- [x] 管理端最终构建并发布：`/var/www/admin`（`index-CqqCtZLJ.js`）
- [x] 后端最终 jar 已部署，数据库密码通过 `/etc/baicai/backend.env` 注入
- [x] C 端 release 回滚演练：`1845 → 1830 → 1845`，两次探活通过
- [x] 管理端备份存在且 `index.html` 完整
- [x] MySQL dump 已保存并校验大小
- [x] 管理端历史备份已保留最近 8 个
- [x] 普通管理员保存配置时后端保留私有 social 字段
- [x] superadmin/admin 登录与角色验证通过
- [x] 公开 API 不再返回 email/token/Typora 本地路径
- [ ] GitHub 远端最新提交推送：本机到 github.com:443 连接被重置，待网络恢复后执行
