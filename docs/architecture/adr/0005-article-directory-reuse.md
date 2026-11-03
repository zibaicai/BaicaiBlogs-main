# ADR-0005：文章目录复用与公开/管理路由分离

- 状态：已采纳
- 日期：2026-11-03

## 背景

管理目录曾另写一套卡片列表，与公开目录逐渐分叉。

同时，公开详情和私有详情混用同一 URL 会让缓存和权限边界复杂。

## 决策

```text
/articles/[slug]           只返回 PUBLISHED + PUBLIC
/articles/manage/[slug]    管理员私有/草稿详情
/articles/manage           管理员完整目录
```

目录复用：

```text
ArticleDirectory
DirectoryExplorer
ArticleCard
```

管理目录只增加：

```text
草稿
私有
公众号
状态标识
管理链接
```

公开目录保持公开缓存和 SEO。

## 后果

- 目录 UI 不再分叉。
- 公开页面可缓存。
- 私有页面 `private, no-store` + `noindex`。
- 管理员在 C 端有完整目录。
