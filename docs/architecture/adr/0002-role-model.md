# ADR-0002：角色模型与 API 命名空间

- 状态：已采纳，迁移中
- 日期：2026-11-03

## 背景

现有 `/api/admin/**` 统一要求 ADMIN / SUPER_ADMIN，与“所有用户都有后台”的产品模型冲突。

## 决策

```text
USER / ADMIN / SUPER_ADMIN
```

API 目标命名空间：

```text
/api/me/**       任意登录用户
/api/admin/**    ADMIN / SUPER_ADMIN
/api/super/**    SUPER_ADMIN
```

个人接口优先迁移到 `/api/me/**`。

## 后果

- 普通用户不会因为访问自己的数据被 403。
- 管理员接口更清晰。
- 迁移期间需要兼容旧路径。

## 当前偏差

后端仍存在 `/api/admin/**` 一刀切，需要按接口或命名空间逐步迁移。
