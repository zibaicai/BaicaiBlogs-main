# 切换与回滚（C 端 / 管理端拆分）

> 目标拓扑
>
> - `www.zibaicai.cn` → `baicai-public`（Next.js，127.0.0.1:3001，只读 C 端）
> - `admin.zibaicai.cn` → `/var/www/admin`（Vite 静态 SPA，React Router 回退）
> - 两者都通过 `location /api/` 反代到 Spring Boot `127.0.0.1:8080`
> - 旧站 `/admin`、`/editor` 301 到 `https://admin.zibaicai.cn/`

## 0. 切换前备份

```bash
TS=$(date +%Y%m%d-%H%M)
cp -a /var/www/admin /var/www/admin.bak.$TS
cp -a /var/www/zibaicai.com /var/www/zibaicai.com.bak.$TS 2>/dev/null || true
cp -a /opt/baicai-public /opt/baicai-public.bak.$TS 2>/dev/null || true
cp -a /etc/nginx/sites-available/baicai-c.conf /root/backup/baicai-c.conf.$TS 2>/dev/null || true
cp -a /etc/nginx/sites-available/baicai.conf /root/backup/baicai.conf.$TS 2>/dev/null || true
```

后端 jar 备份保持在 `/root/backup/`，本次切换不改 jar。

## 1. 构建 C 端（服务器上）

```bash
cd /opt/BaicaiBlogs-main/apps/web
npm ci
npm run build

rm -rf /opt/baicai-public
mkdir -p /opt/baicai-public
cp -a .next/standalone/. /opt/baicai-public/
mkdir -p /opt/baicai-public/.next
cp -a .next/static /opt/baicai-public/.next/static
if [ -d public ]; then cp -a public /opt/baicai-public/public; fi
```

`server.js` 依赖同目录 `node_modules`、`.next/static` 与 `public`，缺一不可。

## 2. 构建管理端并发布静态文件

```bash
cd /opt/BaicaiBlogs-main/apps/admin
npm ci
npm run build
rsync -a --delete dist/ /var/www/admin/
```

`/var/www/admin/index.html` 必须是 Vite 产物；旧版 Next 管理端已备份在 `/var/www/admin.bak.*`。

## 3. 安装 systemd 服务

```bash
install -m 644 /opt/BaicaiBlogs-main/deploy/systemd/baicai-public.service /etc/systemd/system/baicai-public.service
systemctl daemon-reload
systemctl enable baicai-public
systemctl restart baicai-public
curl -I http://127.0.0.1:3001
```

## 4. 安装 nginx 配置

```bash
install -m 644 /opt/BaicaiBlogs-main/deploy/nginx/baicai-c.conf /etc/nginx/sites-available/baicai-c.conf
install -m 644 /opt/BaicaiBlogs-main/deploy/nginx/baicai-admin.conf /etc/nginx/sites-available/baicai-admin.conf

ln -sf /etc/nginx/sites-available/baicai-c.conf /etc/nginx/sites-enabled/baicai-c.conf
ln -sf /etc/nginx/sites-available/baicai-admin.conf /etc/nginx/sites-enabled/baicai-admin.conf

# 同一 server_name 不能有两个生效的 server 块：旧 www 配置让位
rm -f /etc/nginx/sites-enabled/baicai.conf

nginx -t && systemctl reload nginx
```

如果服务器上已有上一轮生成的 `baicai-c.conf`（可能只改了 upstream），以现有文件为准，只把 upstream 指向 `127.0.0.1:3001`。

## 5. 验收

```bash
curl -I https://www.zibaicai.cn/
curl -I https://www.zibaicai.cn/posts
curl -I https://www.zibaicai.cn/timeline
curl -I https://www.zibaicai.cn/admin          # 301 -> admin
curl -I https://www.zibaicai.cn/editor/abc     # 301 -> admin
curl -I https://admin.zibaicai.cn/
curl -s https://www.zibaicai.cn/api/public/posts | head -c 200
```

浏览器检查：

- C 端首页、文章详情、项目、归档、关于/友链/说说/照片墙均不出现编辑/删除/评论输入框；
- `admin.zibaicai.cn` 登录后设置页 10 个面板可读取并保存，刷新后仍生效；
- 编辑器 `/editor/new` 与 `/editor/:slug` 可新建、载入、保存草稿与发布。

## 6. 回滚

### C 端回滚（恢复旧 www）

```bash
rm -f /etc/nginx/sites-enabled/baicai-c.conf
ln -sf /etc/nginx/sites-available/baicai.conf /etc/nginx/sites-enabled/baicai.conf
nginx -t && systemctl reload nginx
systemctl stop baicai-public
```

> 如果切换时保留了旧 `baicai.conf` 且 www 仍由它服务，只删 `baicai-c.conf` 软链并停 `baicai-public` 即可；上面的 `ln -sf` 是旧配置被移除时的兜底。

### 管理端回滚

```bash
rm -rf /var/www/admin
cp -a /var/www/admin.bak.<时间戳> /var/www/admin
rm -f /etc/nginx/sites-enabled/baicai-admin.conf
nginx -t && systemctl reload nginx
```

### 后端回滚

后端未改动；如需回退，从 `/root/backup/` 取对应 jar，替换 `/opt/my-blog-backend-1.0.0.jar` 后 `systemctl restart baicai-backend`。

## 7. 已知坑

- `/api/auth/me` 后端不存在，前端不要调用；登录后用户名从登录响应/localStorage 取。
- 后端 404 会被 `anyRequest().authenticated()` 变成 403，排查时先看 nginx 日志与后端日志，不要只按状态码判断。
- PowerShell 读写 UTF-8 文件用 `[IO.File]::WriteAllText`（或 PS7 默认 UTF-8），避免中文乱码/截断。
- Next.js standalone 必须保留 `.next/static`，否则页面无样式、无 JS。
- 管理端是 SPA，nginx 必须 `try_files ... /index.html`，否则刷新 `/settings`、`/editor/xxx` 会 404。
