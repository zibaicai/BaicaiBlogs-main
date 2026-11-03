# 资源模型

本项目的资源不是只有“文章”。所有内容资源必须明确：

```text
所有者
状态
可见性
公开路由
管理路由
删除策略
缓存策略
```

## 资源总览

| 资源 | 所有者 | 状态 | 可见性 | 公开路由 | 管理路由 |
|---|---|---|---|---|---|
| Article | userId | DRAFT / PUBLISHED / ARCHIVED | PUBLIC / PRIVATE | `/articles/[slug]` | `/articles/manage/[slug]` |
| Post（笔记） | userId | 按业务定义 | PUBLIC / PRIVATE | `/posts/[slug]` | 控制台 `/posts` |
| Moment（说说） | userId | 按业务定义 | PUBLIC / PRIVATE | `/moments/[slug]` | 控制台 `/moments` |
| Project | userId | 按业务定义 | PUBLIC / PRIVATE | `/projects` | 控制台 `/projects` |
| Album / Photo | userId | 按业务定义 | PUBLIC / PRIVATE / PASSWORD | `/photowall` | 控制台 `/gallery` |
| Music | 管理资源 | 按业务定义 | 按业务定义 | `/music` | 控制台 `/music` |
| ArchiveDocument | 导入人 | ACTIVE / ARCHIVED | 仅授权管理员 | 无公开路由 | 控制台 `/archives` |

## Article

Article 是“可编辑、可发布”的内容资源。

```text
owner: userId
status: DRAFT / PUBLISHED / ARCHIVED
visibility: PUBLIC / PRIVATE
source: INTERNAL / WECHAT / GENERIC
```

### 公开规则

公开列表和公开详情只允许：

```text
status = PUBLISHED
visibility = PUBLIC
```

### 私有规则

```text
PRIVATE 或 DRAFT
→ 公开路由 404
→ 仅管理员通过管理路由查看
```

### 来源字段

```text
sourcePlatform
sourceUrl
sourceAuthor
sourceArchiveId
```

用于：

```text
来源说明
去重
回溯
版权标注
```

## ArchiveDocument

ArchiveDocument 是“原始快照”，不是文章。

```text
contentHtml   通用清洗后的正文
rawSnapshot   原始 HTML
sourceUrl     来源
sourceAuthor  原作者
```

用途：

```text
内部查阅
审计
后续转换为 ArticleDraft
```

限制：

```text
不进入公开文章列表
不直接作为 C 端文章展示
图片使用内部鉴权地址
```

## 导入流水线

```text
外部 URL
→ ArchiveDocument
→ ArticleSourceAdapter
→ 统一 ArticleDraft
→ Article
   status = DRAFT
   visibility = PRIVATE
→ 人工编辑
→ 发布
```

适配器：

```text
WeChatArticleAdapter
GenericWebArticleAdapter
```

平台差异不允许进入展示层。

## 图片资源

```text
Article 图片：公开文章图片存储
Archive 图片：私有存档存储
```

存档图片不能直接嵌入公开文章，必须转存。

## 删除策略

```text
Article：删除前确认；可保留来源审计
Archive：删除申请 + 超级管理员审批
用户内容：遵守所有权和审计要求
```

## 缓存策略

```text
公开 Article：可缓存 / ISR
私有 Article：private, no-store
管理目录：dynamic + no-store
Archive：服务端鉴权，不公开缓存
```
