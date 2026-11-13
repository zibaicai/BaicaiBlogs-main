# 前端架构

## 分层

```text
页面 Page
只负责路由、数据加载、权限入口、组合

组合组件 Composition
负责一个业务区域的布局与交互

基础组件 Primitive
负责视觉与行为，不感知页面业务
```

## 基础组件

### GlassSurface

项目级玻璃 primitive。

```text
data-glass
data-glass-scope
data-glass-variant
data-glass-scroll
```

页面不得自己维护 `backdrop-filter` 选择器清单。

### DirectoryExplorer

通用目录容器：

```text
搜索
筛选
排序
网格 / 时间线 / 瀑布流
分页
```

### ArchiveItemCard

目录卡片的唯一基础渲染器，负责：

```text
封面 / 媒体
标题
描述
meta
tag / foot
cover / timeline / masonry 布局
```

所有卡片布局、固定文本区、标题行高和 tag 对齐都只在这里维护。

### ArticleCard

`ArticleCard` 是 `ArchiveItemCard` 的 Article 适配层，只负责：

```text
Article → ArchiveItemCard props
```

支持：

```text
hrefBase
showStatus
layout
```

管理目录与公开目录使用同一个卡片。

禁止：

```text
ArticleCard 自己复制卡片 DOM
ArticleCard 自己维护另一套卡片布局 CSS
页面直接复制 directory-card 结构
```

`PostCard` 同样是 Post 适配层；`ProjectsBoard` 等组合可以直接复用 `ArchiveItemCard`，但不得复制其结构。

封面卡片（`archive-card--cover`）必须遵守固定文本区：

```text
copy 固定高度
meta 固定高度行，无日期也保留占位
title / description 正常文档流
description 与 tag 之间保留空白
tag / foot 固定在卡片底部
```

禁止使用：

```text
height: auto
max-height 代替固定高度
meta 绝对定位后让 title 顶到不可预测的位置
```

标题行高只保留一个来源，不允许 `.resource-title` 与 `.directory-card-title` 互相覆盖导致 1.3 / 1.4 混用。

详细硬规则见 [invariants.md](invariants.md) 第 17、18、19 条。

### ArticleDirectory

文章目录组合组件：

```text
/articles
/articles/manage
```

共用：

```text
DirectoryExplorer
ArticleCard
搜索
排序
视图切换
```

差异只通过 props：

```text
articles
categories
mode = public | manage
```

禁止为管理目录复制一份列表 UI。

`mode` 只允许改变：

```text
数据范围
筛选器
状态角标
链接前缀
页面标题 / 说明
工具栏附加操作
```

`mode` 不得改变：

```text
卡片尺寸
文本区高度
标题起点
标题行高
描述行数
meta 高度
tag / foot 位置
```

禁止使用：

```tsx
className={manage ? "manage-card" : ""}
layout={manage ? "row" : "cover"}
```

public 与 manage 的卡片结构必须完全一致，只允许内容状态不同。

修改卡片后必须运行：

```bash
pnpm --dir apps/web check:card-contract
```

详见 [invariants.md](invariants.md) 第 23 条。

## 页面职责

### `/articles`

- 公开文章数据
- 管理员访问时前端跳转 `/articles/manage`
- 支持 `?view=public` 查看公开视图

### `/articles/manage`

- 服务端校验管理员
- 服务端加载全部文章
- 使用 `ArticleDirectory mode="manage"`
- 不进入公开 sitemap
- `noindex`

### `/articles/manage/[slug]`

- 服务端鉴权
- 渲染私有/草稿文章
- 不显示评论、点赞、分享等公开互动

## 状态设计

管理跳转状态：

```text
确认访问权限
→ 管理员身份已确认
→ 正在进入管理目录
→ replace
```

不要用短暂 Toast 代替页面状态。

## 内容渲染

文章正文必须是统一语义 HTML：

```text
h1-h4
p
ul/ol
blockquote
pre/code
figure/img
table
a
```

不要渲染平台专属 DOM 或平台 CSS。

## 禁止事项

- 页面专属玻璃选择器列表
- 复制目录/卡片组件
- 前端隐藏代替服务端授权
- 403 清登录态
- 客户端根据 role 显示私有数据后再隐藏

## 表单与设置组件登记

页面不得直接写原生 `<select>`，也不得重复实现已有表单控件。

必须优先复用：

```text
components/ui/Button
components/ui/Input
components/ui/Select
components/admin/AdminUI Tabs
components/admin/DataTable
components/settings/SettingsCard
components/settings/SettingsField
components/settings/SettingsControls.inputClass
```

新增基础控件时：

```text
先放入 components/ui 或 components/settings
再在页面中使用
```

禁止：

```text
页面内直接写 <select>
页面内复制 SettingsCard 样式
页面内复制 input 基础样式
```

## Sticky 与滚动容器

吸顶能力必须复用 primitive：

```text
components/ui/StickyPanel
  垂直侧栏、可滚动内容、header/body/footer 插槽

components/ui/StickyBar
  横向工具条，只负责 sticky + top + z-index
```

组件本身不得写死业务距离。位置通过 CSS 变量提供：

```text
--sticky-top
--sticky-max-height
--sticky-z
--sticky-overflow
```

约定：

```text
1. body 必须是 visible，页面滚动交给 window/documentElement
2. 吸顶祖先不得使用 transform/filter/contain
3. 布局容器不得使用 overflow:hidden/auto/scroll
4. 媒体裁切、卡片圆角、列表内部滚动可以使用 overflow
5. 视觉裁切优先 overflow:clip 或 clip-path
6. 固定吸底镜像继续使用 fixed，不强行改为 sticky
```

