# 不可违反的架构规则

以下是项目级契约。违反其中任何一条，都应当停止实现并先修正设计。

## 1. 控制台面向所有用户

```text
Admin 控制台 = 社区用户控制台
不是管理员专用后台
```

普通用户、管理员、超级管理员都可以登录。

## 2. 角色决定能力，不决定能否登录

```text
能否登录：所有有效账户都可以
看到什么：由 USER / ADMIN / SUPER_ADMIN 决定
```

## 3. 401 和 403 语义分离

```text
401：未登录 / token 失效 → 清登录态
403：已登录但无权限 → 保留登录态
```

不允许因为 403 强制退出。

## 4. 公开接口只返回公开资源

```text
PUBLISHED + PUBLIC
```

不得在公开列表或公开详情中返回私有、草稿或管理员资源。

## 5. 私有资源必须服务端鉴权

前端隐藏按钮不等于权限控制。

服务层必须校验：

```text
角色
所有权
资源可见性
```

## 6. 认证 Cookie 必须按用途隔离

不要把普通用户登录态、管理员登录态、C 端预览凭证无设计地塞进同一个跨子域 Cookie。

推荐：

```text
BC_TOKEN        普通登录态
BC_ADMIN_TOKEN  管理员跨子域能力
或短期签名预览 token
```

## 7. 页面不允许维护专属玻璃选择器

玻璃能力必须来自项目级 primitive：

```text
GlassSurface
```

页面不得维护类似：

```css
.page-x .card { backdrop-filter: ... }
```

## 8. 平台差异止步于导入层

```text
WeChat / 知乎 / 通用网页
→ ArticleSourceAdapter
→ 统一 ArticleDraft
→ Article
→ 展示
```

展示层不得出现平台专属 DOM 判断。

## 9. 同类页面复用同一套组件

文章目录、卡片、筛选、排序、视图切换应复用：

```text
ArticleDirectory
DirectoryExplorer
ArticleCard
```

不能为管理目录另写一套列表 UI。

## 10. 公开与私有路由边界清晰

```text
/articles/[slug]          公开详情
/articles/manage/[slug]   管理详情
```

公开路由不返回私有内容；管理路由必须服务端鉴权。

## 11. 私有页面不可被公共缓存

```text
Cache-Control: private, no-store
noindex
```

公开页面才可以公共缓存或 ISR。

## 12. 文章导入必须经过规范化

不允许把外部平台原始 HTML 直接保存为文章正文。

必须：

```text
提取正文
清理脚本/样式
转换图片
转存私有资源
使用统一语义 HTML
```

## 13. 内部存档与文章是两种资源

```text
ArchiveDocument = 原始快照 / 审计
Article          = 可编辑、可发布内容
```

转换必须显式发生，不能把存档直接当文章展示。

## 14. 架构变更必须留痕

涉及以下内容的改动，必须更新文档或新增 ADR：

```text
角色
认证
资源可见性
公开路由
缓存策略
组件分层
导入流程
```

## 15. 不以对话记忆作为架构来源

聊天记录会丢失。

长期事实必须进入：

```text
AGENTS.md
docs/architecture/
docs/architecture/adr/
```

## 16. Sticky 祖先不得污染滚动上下文

```text
页面滚动必须由 window/documentElement 承担
body 不得成为 overflow 滚动容器
布局容器不得使用 overflow:hidden/auto/scroll
吸附容器不得位于 transform/filter/contain 祖先内
```

吸顶行为统一使用：

```text
components/ui/StickyPanel
components/ui/StickyBar
```

具体距离由使用方通过 `--sticky-*` 变量提供。

## 17. 目录卡片文本区必须保持固定结构

`ArticleCard` / `DirectoryExplorer` 的封面卡片必须保持以下结构：

```text
copy（固定高度文本区）
├─ meta（固定高度行，没有日期时也保留占位）
├─ title（正常文档流）
├─ description（正常文档流）
└─ 剩余空白
foot（tag / meta，固定在卡片底部）
```

硬规则：

```text
文本区使用固定高度，不得改成 height:auto
不得用 max-height 代替固定高度
meta 不得绝对定位后让 title 顶到不可预测的位置
title / description 从固定起点从上往下顺排
description 与 tag 之间保留空白
tag 固定在底部对齐
```

禁止用“让内容自己撑开”的方式修复单张卡片溢出。

溢出只能在文本行内部处理：

```text
line-clamp
overflow hidden
固定行数
```

## 18. 重复组件改动前必须验证布局契约

修改 `ArticleCard`、`DirectoryExplorer`、`ArticleDirectory` 等重复组件前，必须先确认：

```text
有日期 / 无日期
短标题 / 两行标题
有描述 / 无描述
有 tag / 无 tag
桌面 / 移动端
```

不得为了修复一张卡片而改变整个列表的结构契约。

如果确实需要改变固定高度、meta 占位或 tag 位置，必须：

```text
更新本文件
更新 docs/architecture/frontend.md
在提交说明中写明结构变化
```

同类问题不得只改 CSS 后不复核其他卡片状态。


