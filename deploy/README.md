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

TS=$(date +%Y%m%d-%H%M%S)
REL=/opt/baicai-public/releases/$TS
mkdir -p "$REL"
cp -a .next/standalone/. "$REL"/
mkdir -p "$REL/.next"
cp -a .next/static "$REL/.next/static"
if [ -d public ]; then cp -a public "$REL/public"; fi
chown -R baicaiweb:baicaiweb "$REL"
ln -sfn "$REL" /opt/baicai-public/current
systemctl restart baicai-public
```

`server.js` 依赖同目录 `node_modules`、`.next/static` 与 `public`，缺一不可。
不要直接清空 `/opt/baicai-public/`，否则会把历史 release 一起删掉；只切换 `current` 软链。

## 2. 构建管理端并发布静态文件

```bash
cd /opt/BaicaiBlogs-main/apps/admin
npm ci
npm run build
TS=$(date +%Y%m%d-%H%M%S)
cp -a /var/www/admin /var/www/admin.bak.$TS
rm -rf /var/www/admin.new
mkdir -p /var/www/admin.new
tar -C dist -cf - . | tar -C /var/www/admin.new -xf -
chmod -R u+rwX,go+rX /var/www/admin.new
rm -rf /var/www/admin
mv /var/www/admin.new /var/www/admin
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

## 4. 切换 www 上游与旧入口重定向

生产环境不要用 `deploy/nginx/baicai-www.conf` 覆盖现有 `baicai.conf`——后者还带着
443/SSL、ACME 与 VulnArk 的 include。只做两处最小改动：

```bash
TS=$(date +%Y%m%d-%H%M%S)
mkdir -p /root/backup
cp -a /etc/nginx/sites-available/baicai.conf /root/backup/baicai.conf.$TS

cat > /etc/nginx/snippets/baicai-legacy-redirect.conf <<'EOF'
location = /admin { return 301 https://admin.zibaicai.cn/; }
location ^~ /admin/ { return 301 https://admin.zibaicai.cn/; }
location = /editor { return 301 https://admin.zibaicai.cn/editor; }
location ^~ /editor/ { return 301 https://admin.zibaicai.cn$request_uri; }
EOF

# 1) www 前端 3000 -> 3001（只改第一处 upstream）
sed -i '0,/server 127.0.0.1:3000;/s//server 127.0.0.1:3001;/' /etc/nginx/sites-available/baicai.conf
# 2) 在 443 server 块内引入旧入口重定向
grep -q 'baicai-legacy-redirect.conf' /etc/nginx/sites-available/baicai.conf || \
  sed -i '/server_name www.zibaicai.cn;/a\    include /etc/nginx/snippets/baicai-legacy-redirect.conf;' /etc/nginx/sites-available/baicai.conf

nginx -t && systemctl reload nginx
```

`baicai-admin.conf`（admin 静态站 + `/api/` 反代）在服务器上已生效；重建环境时可用
`deploy/nginx/baicai-admin.conf` 参考，但同样要补齐现有 SSL/ACME 配置。

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

### C 端回滚（恢复旧 www -> 3000）

```bash
systemctl stop baicai-public

# 方式 A：直接用切换前备份恢复（推荐）
cp -a /root/backup/baicai.conf.<时间戳> /etc/nginx/sites-available/baicai.conf

# 方式 B：只把 upstream 改回 3000，并移除旧入口 include
# sed -i '0,/server 127.0.0.1:3001;/s//server 127.0.0.1:3000;/' /etc/nginx/sites-available/baicai.conf
# sed -i '/baicai-legacy-redirect.conf/d' /etc/nginx/sites-available/baicai.conf

nginx -t && systemctl reload nginx
```

旧站 Next 进程仍监听 3000，回滚后 www 立即恢复；C 端 release 目录保留，可随时把
`/opt/baicai-public/current` 切回上一版并重启 `baicai-public`。

### 管理端回滚

```bash
rm -rf /var/www/admin
cp -a /var/www/admin.bak.<时间戳> /var/www/admin
```

nginx 的 `admin.zibaicai.cn` 配置无需改动（仍是静态目录 + `/api/` 反代）。

### 后端回滚

后端未改动；如需回退，从 `/root/backup/` 取对应 jar，替换 `/opt/my-blog-backend-1.0.0.jar` 后 `systemctl restart baicai-backend`。

## 7. 已知坑

- `/api/auth/me` 后端不存在，前端不要调用；登录后用户名从登录响应/localStorage 取。
- 后端 404 会被 `anyRequest().authenticated()` 变成 403，排查时先看 nginx 日志与后端日志，不要只按状态码判断。
- PowerShell 读写 UTF-8 文件用 `[IO.File]::WriteAllText`（或 PS7 默认 UTF-8），避免中文乱码/截断。
- Next.js standalone 必须保留 `.next/static`，否则页面无样式、无 JS。
- 管理端是 SPA，nginx 必须 `try_files ... /index.html`，否则刷新 `/settings`、`/editor/xxx` 会 404。
