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

### ArticleCard

文章卡片，支持：

```text
hrefBase
showStatus
```

管理目录与公开目录使用同一个卡片。

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
