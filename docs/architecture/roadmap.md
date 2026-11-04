# 后续路线

## 文章审核流

第一阶段：

- `DRAFT / PENDING_REVIEW / PUBLISHED / REJECTED`
- USER 提交审核
- ADMIN 通过/驳回
- 已发布文章 USER 撤回后才能编辑
- 私密文章直接发布

## 第二阶段：文章修订版本

状态：待实施。

目标：

- 新增 `ArticleRevision`
- 线上版本与待审核版本分离
- 审核通过后替换发布版本
- 支持回滚与审核快照

## 其他暂缓

- 音乐个人歌单
- 移动端真机回归
