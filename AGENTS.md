# AGENTS.md

本文件是后续开发者和 AI Agent 进入本仓库的入口。

## 修改代码前必须阅读

1. `docs/architecture/invariants.md`
2. `docs/architecture/roles.md`
3. `docs/architecture/resources.md`
4. 与改动模块相关的 `docs/architecture/frontend.md`、`docs/architecture/backend.md` 或 `docs/architecture/operations.md`
5. 修改 `ArchiveItemCard` / `ArticleCard` / `PostCard` / `DirectoryExplorer` / 列表卡片前，必须阅读 `invariants.md` 第 17、18、19、20、21、22 条

## 项目定位

这是一个**社区网站**，不是单人博客，也不是“管理员专用后台”。

- C 端面向公开访问。
- Admin 控制台面向**所有注册用户**。
- 角色分为 `USER`、`ADMIN`、`SUPER_ADMIN`。
- 普通用户登录控制台后进入自己的内容工作区。
- 管理员角色只决定“能看到多少管理能力”，不决定“能否登录控制台”。

## 不可违反的硬规则

1. 不允许把 Admin 控制台改成管理员专用。
2. 403 表示已登录但无权限，不允许因此清除 token 或强制跳登录。
3. 401 才表示未登录或登录失效。
4. 公开接口只返回 `PUBLISHED + PUBLIC` 资源。
5. 私有资源必须服务端鉴权，不能只靠前端隐藏。
6. 普通用户与管理员不应无设计地共用同一个跨子域 Cookie。
7. 页面不允许维护页面专属的玻璃选择器清单。
8. 外部平台差异只允许存在于导入适配层。
9. 文章目录等同类页面应复用同一套目录组件，只通过 props 区分模式。
10. 新建页面前必须先查 `components/ui`、`components/settings`、`components/admin`，禁止直接写原生 `<select>` 或复制已有表单/卡片样式。
11. 涉及角色、认证、资源可见性或公共路由的改动，必须更新对应架构文档或新增 ADR。

## 文档更新要求

- 跨模块改动：更新 `docs/architecture/*.md`
- 架构决策：在 `docs/architecture/adr/` 新增 ADR
- 不要只把设计留在对话、提交信息或代码注释里

## 技术栈

- C 端：Next.js + React + Tailwind CSS
- 控制台：Vite + React + React Router
- 后端：Spring Boot + JPA + MySQL
- 部署：Nginx + systemd + 独立 release 目录
