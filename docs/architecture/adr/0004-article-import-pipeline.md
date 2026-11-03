# ADR-0004：文章导入适配层

- 状态：已采纳
- 日期：2026-11-03

## 背景

需要从微信公众号等平台通过链接导入文章，并作为站内文章管理。

外部平台 HTML 结构、图片地址、代码块结构不同，不能直接进入文章展示层。

## 决策

```text
ArchiveDocument
→ ArticleSourceAdapter
→ ImportedArticle
→ Article
```

首批适配器：

```text
WeChatArticleAdapter
GenericWebArticleAdapter
```

约定：

- 平台差异只存在于适配器。
- 展示层只接收统一语义 HTML。
- 图片重新转存到文章公开存储。
- 导入默认 `DRAFT + PRIVATE`。
- 必须经过人工编辑后发布。

## 后果

- 新增平台只需新增适配器。
- 文章模块保持平台无关。
- 存档保留原始快照，文章保留可编辑内容。
