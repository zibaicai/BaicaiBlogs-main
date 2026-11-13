# 角色模型

## 角色

```text
USER
ADMIN
SUPER_ADMIN
```

## 登录规则

```text
USER        可以登录控制台
ADMIN       可以登录控制台
SUPER_ADMIN 可以登录控制台
```

登录后根据角色进入不同工作区，而不是在登录阶段拒绝普通用户。

## 能力矩阵

| 能力 | USER | ADMIN | SUPER_ADMIN |
|---|---:|---:|---:|
| 登录控制台 | ✓ | ✓ | ✓ |
| 管理自己的文章 | ✓ | ✓ | ✓ |
| 管理自己的说说 | ✓ | ✓ | ✓ |
| 管理自己的项目 | ✓ | ✓ | ✓ |
| 管理自己的相册 | ✓ | ✓ | ✓ |
| 修改个人资料 | ✓ | ✓ | ✓ |
| 查看全站内容 | ✗ | ✓ | ✓ |
| 内容审核 / 举报处理 | ✗ | ✓ | ✓ |
| 用户管理 | ✗ | ✓ | ✓ |
| 系统配置 | ✗ | ✗ | ✓ |
| 内部存档 | ✗ | ✗ | ✓ |
| 隐私审计 | ✗ | ✗ | ✓ |
| IP 封禁 | ✗ | ✗ | ✓ |
| 超级管理员授权 | ✗ | ✗ | ✓ |

更细的权限以服务层校验为准，不以隐藏菜单作为授权。

“管理自己的文章”包括：

```text
DRAFT / PRIVATE / PUBLISHED 的所有权校验
作者可编辑、删除、提交、撤回自己的文章
管理员的全站管理能力是额外能力
```

公开访问仍然只允许：

```text
PUBLISHED + PUBLIC
```


## API 命名空间目标

```text
/api/me/**       任意已登录用户
/api/admin/**    ADMIN / SUPER_ADMIN
/api/super/**    SUPER_ADMIN
```

`/api/admin/**` 不能继续采用“路径一刀切”的授权方式。

以下这类接口必须允许普通用户访问，或迁移到 `/api/me/**`：

```text
/api/admin/posts/mine
/api/admin/moments/mine
/api/admin/projects/mine
/api/admin/albums/mine
/api/admin/profile
```

## 当前迁移状态

当前后端仍存在：

```text
/api/admin/** -> hasAnyRole(ADMIN, SUPER_ADMIN)
```

这会导致普通用户登录控制台后请求自己的数据也被 403。

后续需要：

1. 将个人接口迁移到 `/api/me/**`，或按接口单独授权。
2. 控制台首页按角色请求对应概览。
3. `USER` 不请求管理员专属概览。
4. 403 不清除登录态，不强制退出。

## 前端路由目标

| 路由 | 允许角色 |
|---|---|
| `/` 控制台首页 | USER / ADMIN / SUPER_ADMIN |
| `/posts` | 所有用户，数据按所有权过滤 |
| `/moments` | 所有用户，数据按所有权过滤 |
| `/projects` | 所有用户，数据按所有权过滤 |
| `/gallery` | 所有用户，数据按所有权过滤 |
| `/reports` | ADMIN / SUPER_ADMIN |
| `/privacy` | SUPER_ADMIN |
| `/ip-bans` | SUPER_ADMIN |
| `/archives` | SUPER_ADMIN |
| `/settings` | ADMIN / SUPER_ADMIN |

## 401 与 403

```text
401
未登录或登录失效
→ 清理登录态
→ 跳转登录

403
已登录但无权限
→ 保留登录态
→ 展示无权限提示
→ 不跳登录
```

这条规则适用于控制台和 C 端管理页面。
