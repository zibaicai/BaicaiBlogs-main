# 🥬 白菜博客 (BaicaiBlogs)

一套自托管的个人博客系统：Next.js C 端博客 + Vite 管理后台 + Spring Boot 后端，配套一键启动与一键部署脚本。

- 博客前台：<https://www.zibaicai.cn>
- 管理后台：<https://admin.zibaicai.cn>

---

## 架构

```
浏览器
  │
  ▼
Nginx (80/443, zibaicai.cn)
  ├── www.zibaicai.cn   → baicai-public   (Next.js, 127.0.0.1:3001)
  ├── admin.zibaicai.cn → /var/www/admin  (Vite 静态 SPA)
  └── /api/*            → baicai-backend  (Spring Boot, 127.0.0.1:8080)
                              │
                              ▼
                          MySQL (blogs 库)
```

| 模块 | 目录 | 技术 | 说明 |
|------|------|------|------|
| C 端博客 | `apps/web` | Next.js（standalone 输出） | 只读展示：文章 / 说说 / 相册 / 时间线 / 友链 |
| 管理后台 | `apps/admin` | Vite + React + React Router | 登录、写作、站点设置，构建产物为纯静态文件 |
| 后端服务 | `my-blog-backend` | Spring Boot (Java 17) + MySQL | REST API，JWT 鉴权，端口 8080 |

## 目录结构

```
BaicaiBlogs-main/
├── apps/
│   ├── web/               # C 端博客前端（Next.js）
│   └── admin/             # 管理后台（Vite + React）
├── my-blog-backend/       # Spring Boot 后端
│   ├── sql/init.sql       # 数据库初始化脚本
│   └── target/*.jar       # Maven 打包产物
├── deploy/                # 生产环境配置（Nginx / systemd）与切换手册
├── deploy.config.json     # ★ 唯一环境配置：服务器 / 目录 / 服务名 / 域名 / 端口
├── deploy.mjs             # ★ 一键部署脚本
└── start.mjs              # ★ 本地开发一键启动
```

## 环境要求

- Node.js 18+（本机与部署服务器都需要）
- JDK 17+、Maven（后端开发；本机没装 Maven 时可在 IDEA 里打包）
- MySQL 8+
- Git、SSH（部署机到服务器需配置 SSH 免密登录）

## 本地开发

```bash
node start.mjs
```

脚本会自动完成：

1. 环境自检（node / npm / java / MySQL 3306）
2. 启动后端（优先 `mvn spring-boot:run`，没有 Maven 则用 `target` 里的现成 jar）
3. 启动 C 端 `apps/web` → <http://localhost:3001>（新窗口）
4. 启动管理端 `apps/admin` → <http://localhost:5173>（新窗口）

某个端口已有服务在跑时自动跳过，首次运行会自动 `npm install`。

手动启动（等效方式）：

```bash
cd my-blog-backend && mvn spring-boot:run   # 或 IDEA 直接跑 MyBlogApplication
cd apps/web   && npm run dev                # 3001
cd apps/admin && npm run dev                # 5173
```

首次使用需初始化数据库：创建 `blogs` 库并导入 `my-blog-backend/sql/init.sql`。初始化 SQL 保留了管理员引导账号，但默认凭据不在本文档公开；部署后请立即修改管理员密码，并另行创建唯一的超级管理员账号用于敏感配置。

## 一键部署

所有部署命令在项目根目录执行，目标服务器信息集中在 [deploy.config.json](deploy.config.json)。

```bash
node deploy.mjs setup            # 首次一次性：服务器克隆仓库 + 环境自检
node deploy.mjs status           # 查看线上发布状态（只读）
node deploy.mjs web              # 发布 C 端
node deploy.mjs admin            # 发布管理端
node deploy.mjs backend          # 发布后端 jar
node deploy.mjs all              # 全量发布（web → admin → backend）
node deploy.mjs rollback web     # 回滚 C 端到上一个 release（--to 指定版本）
node deploy.mjs rollback admin   # 回滚管理端到最近一次备份
```

### 发布流程说明

- **web / admin**：本地推送 → 服务器 `git pull` → 服务器上 `npm ci && npm run build` → 生成时间戳 release 并切换软链（web）或原子替换静态目录（admin）→ 重启服务 → 内外网探活
- **backend**：上传 `my-blog-backend/target/*.jar`（没有 Maven 时先在 IDEA 打包）→ 旧 jar 备份到 `/root/backup/` → 重启服务 → API 探活
- 本地有未提交改动时会拒绝发布（防止线上和仓库不一致），可用 `--allow-dirty` 强行跳过

### 回滚

- C 端采用 **releases 目录 + `current` 软链**方案，历史版本全部保留，回滚只切软链、秒级生效
- 管理端每次发布前自动备份到 `/var/www/admin.bak.<时间戳>`
- 后端 jar 备份在服务器 `/root/backup/`

## 生产环境配置

服务器与目录等事实集中定义在 [deploy.config.json](deploy.config.json)，换服务器 / 改目录只动这一个文件：

| 配置项 | 当前值 |
|--------|--------|
| 服务器 | `root@8.153.164.215`（SSH 免密） |
| 服务器仓库 | `/opt/BaicaiBlogs-main` |
| C 端发布目录 | `/opt/baicai-public/releases/<时间戳>` + `current` 软链 |
| 管理端静态目录 | `/var/www/admin` |
| 后端 jar | `/opt/my-blog-backend-1.0.0.jar` |
| systemd 服务 | `baicai-public` / `baicai-backend` |
| Nginx 配置参考 | `deploy/nginx/`，systemd 参考见 `deploy/systemd/` |

切换与回滚的完整手工流程存档在 [deploy/README.md](deploy/README.md)。

### 常用运维命令（服务器上）

```bash
systemctl status baicai-public     # C 端进程
systemctl status baicai-backend    # 后端进程
journalctl -u baicai-backend -f    # 后端实时日志
tail -f /var/log/nginx/*.log       # Nginx 日志
```

## 默认静态资源

以下默认资源随仓库自带，均位于 `apps/web/public/`，通过 `https://www.zibaicai.cn/` 访问：

| 文件 | 用途 |
|------|------|
| `favicon.ico` | 网站 ico（浏览器标签图标） |
| `avatar.jpg` | 默认用户头像 / 友链申请文案中的头像 |
| `bg-1.webp` `bg-2.webp` `bg-3.webp` `bg-5.webp` | 全站背景图（随机轮换） |
| `bg-2.webp` | 音乐播放器默认歌曲封面 |
| `bg-3.webp` | 文章默认封面 |
| `bg-4.webp` | 首页照片墙封面 |

想换成自己的图，两种方式任选：

1. **推荐**：登录管理后台 `admin.zibaicai.cn` → 设置页，修改对应字段（可填图床外链），保存即全站生效
2. **改代码默认值**：替换 `apps/web/public/` 下的同名文件，或修改以下文件中的默认 URL
   - `apps/web/lib/site-config.ts`（DEFAULT_SITE_INFO / DEFAULT_BACKGROUND / DEFAULT_MISC）
   - `apps/web/components/MusicProvider.tsx`（音乐默认封面）
   - `apps/admin/src/hooks/useSiteConfig.ts`（DEFAULT_SITE_INFO 等三组默认值）

## 更新日志

见 [UpdateLog.md](UpdateLog.md)。

## 来源与致谢

本项目在立项与架构规划阶段参考了 [XingHuiSama 的 XHBlogs](https://github.com/heiehiehi/XinghuisamaBlogs) 模板架构，早期选用过其中部分通用组件与页面结构。此后项目按自身需求持续迭代，代码由本项目作者维护。感谢原作者的开源分享。

## 许可证

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)

本项目沿用 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) 协议：可自由学习、分享与二次修改（发布需注明原作者），**严禁商用**。
