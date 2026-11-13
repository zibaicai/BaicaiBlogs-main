# 后端架构

## 分层

```text
Controller
接收请求、解析身份、返回 ApiResponse
不写复杂业务规则

Service
权限校验
所有权校验
状态与可见性规则
事务边界

Repository
数据访问
```

## 认证

登录对三种角色开放：

```text
USER
ADMIN
SUPER_ADMIN
```

JWT 支持：

```text
Authorization: Bearer <token>
BC_TOKEN Cookie
BC_ADMIN_TOKEN Cookie
```

角色来自数据库用户，不来自前端声明。

### 密钥与有效期

JWT secret 只来自环境变量：

```text
JWT_SECRET
```

不得写进仓库、JAR、前端或日志。

有效期：

```text
普通用户：24 小时
管理员：2 小时
```

### tokenVersion

JWT 包含：

```text
sub
tokenVersion
iat
exp
```

每次请求与数据库 `users.token_version` 比较：

```text
不一致 → 拒绝认证
```

封禁、改密、管理员强制下线时递增 tokenVersion。

### 2FA

管理员和普通用户都可以绑定 TOTP。

登录流程：

```text
用户名 + 密码
→ 需要 2FA 时返回 challengeToken
→ POST /api/auth/2fa/verify
→ 签发正式 token
```

challengeToken：

```text
scope=2fa
有效期 5 分钟
不能访问业务接口
```

TOTP secret 只存数据库，不返回给前端；绑定接口返回一次 `otpauthUrl`。

### 密码

```text
POST /api/auth/password
旧密码校验
新密码至少 12 位
不能与旧密码相同
成功后 tokenVersion + 1
```

超级管理员可以重置普通用户密码：

```text
POST /api/admin/users/{id}/password/reset
```

返回一次性临时密码，旧 token 立即失效。

## 授权命名空间目标

```text
/api/me/**       任意登录用户
/api/admin/**    ADMIN / SUPER_ADMIN
/api/super/**    SUPER_ADMIN
```

个人资源接口必须允许普通用户访问，不能因为路径叫 admin 就全部拒绝。

推荐迁移：

```text
/api/admin/posts/mine      → /api/me/posts
/api/admin/moments/mine    → /api/me/moments
/api/admin/projects/mine   → /api/me/projects
```

过渡期可以在 `/api/admin/**` 内部按接口授权。

## 401 与 403

```text
401：未认证
403：已认证但无权限
```

前端不得把 403 当登录失效。

## Cookie 边界

普通用户和管理员能力必须隔离：

```text
BC_TOKEN
普通登录态

BC_ADMIN_TOKEN
管理员跨子域管理能力
```

Cookie 必须：

```text
HttpOnly
Secure（HTTPS）
SameSite=Lax
Path=/
```

管理端 token 不得写入 localStorage。

不要把普通用户 token 写入 `.zibaicai.cn` 后又被管理员页面复用。

C 端管理目录需要管理员身份时，使用独立的管理员 Cookie 或短期签名 token。

前端请求统一：

```text
credentials: "include"
```

不得手工从 localStorage 读取 token 拼 Authorization。


## 资源授权

服务层必须校验：

```text
用户是否登录
角色是否足够
资源是否属于该用户
资源是否 PUBLISHED + PUBLIC
```

不能只依赖路由前缀。

## 文章导入

```text
ArticleSourceAdapter
├── WeChatArticleAdapter
├── GenericWebArticleAdapter
└── 后续平台适配器

ArticleImportService
→ 选取适配器
→ 提取统一 ArticleDraft
→ 图片转存
→ ArticleService.create
```

平台适配器只负责提取和规范化，不负责发布。

## 外部抓取安全

```text
只允许 http/https
阻止内网地址
限制重定向、响应大小、超时
识别验证页
不绕过登录、验证码或平台风控
```

## 缓存

```text
公开资源：可缓存
私有资源：private, no-store
管理接口：不进入公共缓存
```

## 审计

高风险操作需要保留：

```text
操作者
资源
时间
原因
结果
```

IP 封禁、存档删除、隐私访问、管理员授权都属于高风险操作。
