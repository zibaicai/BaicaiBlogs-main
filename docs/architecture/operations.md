# 运维与发布

本文记录服务器、构建、发布、回滚和凭据管理的长期规则。

## 服务器

```text
主机: 8.153.164.215
系统: Ubuntu 24.04 LTS
入口: Nginx
后端: systemd + Spring Boot
C 端: Next.js standalone + systemd
管理端: Vite 静态产物 + Nginx
数据库: MySQL 127.0.0.1:3306
```

## 目录

```text
/opt/baicai-public/current          C 端当前 release symlink
/opt/baicai-public/releases/         C 端 release 目录
/opt/my-blog-backend-1.0.0.jar      后端 JAR
/etc/baicai/backend.env             服务端密钥环境文件，600
/etc/systemd/system/                 服务 unit
/etc/nginx/sites-enabled/            Nginx 配置
/var/www/admin/                      管理端静态产物
/root/backup/                        备份与回滚文件
```

## 服务

```text
baicai-public           C 端 Next.js
baicai-backend          后端 Spring Boot
baicai-fail2ban-agent   fail2ban 受限 agent
nginx
mysql
ssh
```

后端必须：

```text
User=baicai-backend
NoNewPrivileges=true
JAR: root:baicai-backend 640
```

fail2ban 只能通过 Unix Socket agent 调用，不允许后端直接 sudo。

## C 端发布

```text
1. pnpm --dir apps/web build
2. 生成独立 release 目录
3. 放入 .next/server、.next/static、server.js、package.json
4. chown -R baicaiweb:baicaiweb
5. ln -sfn <new-release> /opt/baicai-public/current
6. systemctl restart baicai-public
7. curl http://127.0.0.1:3001/
8. 检查关键页面和静态资源
```

发布不得直接覆盖当前 release。失败时：

```text
ln -sfn <previous-release> /opt/baicai-public/current
systemctl restart baicai-public
```

## 后端发布

```text
1. mvn -DskipTests package
2. scp 到 /opt/*.tmp
3. sha256sum -c
4. 备份当前 JAR
5. mv 到 /opt/my-blog-backend-1.0.0.jar
6. chown root:baicai-backend，chmod 640
7. systemctl restart baicai-backend
8. 轮询 /api/public/posts，直到 200
9. 检查 journalctl 无启动异常
```

启动约 40 秒，健康检查必须轮询，不能固定 sleep 后只请求一次。

## 管理端发布

```text
1. pnpm --dir apps/admin build
2. 备份 /var/www/admin
3. 解压到 /var/www/admin.new
4. chown -R www-data:www-data
5. 原子切换目录
6. systemctl reload nginx
```

管理端请求必须带 Cookie，不依赖 localStorage token。

## 回滚

```text
C 端：切换 current symlink
后端：恢复 /root/backup 中的 JAR
管理端：恢复 /var/www/admin.bak-*
数据库：使用 /root/backup 的 SQL 备份
```

回滚后必须验证：

```text
登录
公开文章列表
文章详情
管理端
上传
```

## 凭据

```text
JWT_SECRET
DB_USERNAME
DB_PASSWORD
OSS_ACCESS_KEY_ID
OSS_ACCESS_KEY_SECRET
TURNSTILE_*
```

只存在于：

```text
/etc/baicai/backend.env
```

规则：

```text
文件 600
不进入 Git
不打印到日志
不写入前端
不在聊天或文档中记录明文
轮换后重启后端
```

Git 历史中的旧凭据一律视为已泄露，必须轮换，不能只删文件。

## 视觉测试与 WAF

Playwright / 截图测试不得在未认证状态下访问：

```text
/articles/manage
```

未认证访问会产生 404/403，并可能触发 `baicai-scan` 的 4xx 规则，导致测试出口 IP 被 fail2ban 全端口封禁。

规则：

```text
manage 测试必须提供有效 ADMIN_COOKIE
没有有效 Cookie 时 skip，不得用无效 Cookie 硬跑
优先对本地或预发布环境跑视觉测试
```

如果测试出口 IP 被封：

```bash
fail2ban-client set baicai-scan unbanip <ip>
```

不要长期把动态办公 IP 加入 `ignoreip`。

## 安全操作

```text
SSH 只允许密钥登录
root 只允许密钥登录
管理端使用 2FA
数据库应用账号只授予 DML
3306 不对公网监听
高风险操作必须审计
```

安装系统包前先检查：

```text
内存
磁盘
needrestart 是否会重启 ssh
是否有带外控制台
```

不得在只有单一 SSH 通道时执行可能中断 sshd 的操作。

## 备份

```text
数据库：每日备份，保留至少 14 天
发布前：备份当前 JAR / admin / release
安全事件：保留 auth、Nginx、binlog、DB 快照
```

备份文件默认 600，不放在 webroot。

## 发布检查

```text
页面 200
API 200
静态资源 200
systemd active
NoNewPrivileges=yes
无 5xx
无 OOM
```
