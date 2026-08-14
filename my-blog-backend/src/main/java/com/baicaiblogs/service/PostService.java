package com.baicaiblogs.service;

import com.baicaiblogs.dto.*;
import com.baicaiblogs.entity.Post;
import com.baicaiblogs.repository.PostRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.commonmark.node.Node;
import org.commonmark.parser.Parser;
import org.commonmark.renderer.html.HtmlRenderer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 文章服务层
 *
 * 职责：
 * 1. 公开接口（getAllPosts / getPosts / getPostBySlug / searchPosts）—— 不区分用户，返回所有已发布文章
 * 2. 用户私有接口（getPostsByUser / createPost / updatePost / deletePost）—— 按 userId 隔离，只能操作自己的文章
 *
 * tags 字段在数据库中以 JSON 字符串存储（例如 ["React","Spring Boot"]），
 * 在 Service 层负责 List<String> 与 JSON 字符串之间的序列化/反序列化。
 */
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    /** commonmark Markdown 解析器，用于将 Markdown 原文渲染为 HTML */
    private final Parser markdownParser = Parser.builder().build();
    private final HtmlRenderer htmlRenderer = HtmlRenderer.builder().build();
    /** Jackson ObjectMapper，用于 tags 字段的 JSON 序列化/反序列化 */
    private final ObjectMapper objectMapper;

    // ==================== 公开接口（无需登录） ====================

    /**
     * 获取所有已发布文章（公开接口，不分用户）
     * 用于前台访客浏览所有作者的文章列表
     */
    @Transactional(readOnly = true)
    public List<PostResponse> getAllPosts() {
        return postRepository.findAllPublished().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * 分页获取已发布文章（公开接口）
     */
    @Transactional(readOnly = true)
    public PageResponse<PostResponse> getPosts(int page, int size) {
        Page<Post> postPage = postRepository.findAllPublished(PageRequest.of(page, size));
        return new PageResponse<>(
                postPage.getContent().stream().map(this::toResponse).collect(Collectors.toList()),
                postPage.getTotalElements(),
                postPage.getTotalPages(),
                postPage.getNumber(),
                postPage.getSize()
        );
    }

    /**
     * 按 slug 获取单篇文章（公开接口）
     */
    @Transactional(readOnly = true)
    public PostResponse getPostBySlug(String slug) {
        Post post = postRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("文章不存在: " + slug));
        return toResponse(post);
    }

    /**
     * 搜索已发布文章（公开接口，按标题和描述模糊匹配）
     */
    @Transactional(readOnly = true)
    public List<PostResponse> searchPosts(String keyword) {
        return postRepository.searchPublished(keyword).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ==================== 用户私有接口（需要登录，按 userId 隔离） ====================

    /**
     * 获取当前登录用户的全部已发布文章（时间线页面使用）
     *
     * @param userId 当前登录用户 ID
     * @return 该用户的已发布文章列表，按发布时间倒序
     */
    @Transactional(readOnly = true)
    public List<PostResponse> getPostsByUser(Long userId) {
        return postRepository.findPublishedByUserId(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * 获取当前登录用户所有文章中出现过的 tag 集合（去重）
     * 用于编辑器的标签历史提示功能
     *
     * 实现方式：查询该用户全部文章（含 DRAFT），逐篇反序列化 tags JSON，汇总去重
     *
     * @param userId 当前登录用户 ID
     * @return 去重后的标签列表（按首次出现顺序排列）
     */
    @Transactional(readOnly = true)
    public List<String> getAllTagsByUser(Long userId) {
        // 查询该用户全部文章（不限状态）
        List<Post> allPosts = postRepository.findAllByUserId(userId);
        // 用 LinkedHashSet 去重并保持插入顺序
        Set<String> tagSet = new LinkedHashSet<>();
        for (Post post : allPosts) {
            List<String> tags = deserializeTags(post.getTags());
            tagSet.addAll(tags);
        }
        return new ArrayList<>(tagSet);
    }

    /**
     * 按 slug 获取当前登录用户的单篇文章（管理接口，不限发布状态）
     * 用于编辑器加载文章内容进行编辑
     *
     * @param userId 当前登录用户 ID
     * @param slug   文章 slug
     * @return 文章信息（含 Markdown 原文和 HTML）
     */
    @Transactional(readOnly = true)
    public PostResponse getPostBySlugForUser(Long userId, String slug) {
        // 按 slug + userId 组合查询，防止越权访问他人文章
        Post post = postRepository.findBySlugAndUserId(slug, userId)
                .orElseThrow(() -> new RuntimeException("文章不存在或无权访问: " + slug));
        return toResponse(post);
    }

    /**
     * 上传 Markdown 文件并导入为文章
     *
     * 解析流程：
     * 1. 读取文件内容（UTF-8）
     * 2. 解析 YAML frontmatter（--- 包围的部分），提取 title/date/tags/cover/description
     * 3. frontmatter 之后的正文作为 Markdown content
     * 4. slug 从文件名生成（去掉 .md 后缀）
     * 5. 如果该 slug 在当前用户下已存在，则更新；否则创建新文章
     *
     * @param userId 当前登录用户 ID
     * @param file   上传的 .md 文件
     * @return 创建或更新后的文章信息
     */
    @Transactional
    public PostResponse uploadPost(Long userId, MultipartFile file) throws IOException {
        // 读取文件全部内容（UTF-8 编码）
        String rawContent = new String(file.getBytes(), StandardCharsets.UTF_8);

        // 解析 frontmatter，分离出元数据和正文
        FrontmatterParseResult parsed = parseFrontmatter(rawContent);

        // slug 从文件名生成：去掉 .md 后缀，空格替换为连字符
        String originalFilename = file.getOriginalFilename();
        String slug = generateSlugFromFilename(originalFilename);

        // 渲染 Markdown 正文为 HTML
        String htmlContent = renderMarkdown(parsed.body);

        // 判断是创建还是更新（同一用户下 slug 重复则更新）
        if (postRepository.existsBySlugAndUserId(slug, userId)) {
            // 更新已有文章
            Post post = postRepository.findBySlugAndUserId(slug, userId)
                    .orElseThrow(() -> new RuntimeException("文章不存在: " + slug));
            post.setTitle(parsed.title != null ? parsed.title : slug);
            post.setDescription(parsed.description);
            post.setContent(parsed.body);
            post.setHtmlContent(htmlContent);
            post.setTags(serializeTags(parsed.tags));
            post.setCover(parsed.cover);
            if (parsed.date != null) {
                post.setDate(parsed.date);
            }
            post.setStatus("PUBLISHED");
            return toResponse(postRepository.save(post));
        } else {
            // 创建新文章
            Post post = Post.builder()
                    .slug(slug)
                    .userId(userId)
                    .title(parsed.title != null ? parsed.title : slug)
                    .description(parsed.description)
                    .content(parsed.body)
                    .htmlContent(htmlContent)
                    .tags(serializeTags(parsed.tags))
                    .cover(parsed.cover)
                    .date(parsed.date != null ? parsed.date : LocalDateTime.now())
                    .status("PUBLISHED")
                    .views(0)
                    .build();
            return toResponse(postRepository.save(post));
        }
    }

    // ==================== Frontmatter 解析（内部辅助） ====================

    /**
     * Frontmatter 解析结果
     * - frontmatter: YAML 元数据部分（原始文本）
     * - body: 正文 Markdown（去掉 frontmatter 后）
     * - title/description/cover/date/tags: 解析后的字段
     */
    private static class FrontmatterParseResult {
        String title;
        String description;
        String cover;
        LocalDateTime date;
        List<String> tags;
        String body;
    }

    /**
     * 解析 Markdown 文件的 YAML frontmatter
     *
     * 支持格式：
     * ---
     * title: 文章标题
     * date: 2026-08-14
     * description: 描述
     * cover: https://example.com/cover.jpg
     * tags: [React, Spring Boot]
     * ---
     * 正文内容...
     *
     * 或 tags 多行格式：
     * tags:
     *   - React
     *   - Spring Boot
     *
     * 如果没有 frontmatter（文件不以 --- 开头），则整个内容作为 body，
     * title 从第一个 # 标题或文件名推断
     */
    private FrontmatterParseResult parseFrontmatter(String rawContent) {
        FrontmatterParseResult result = new FrontmatterParseResult();
        result.tags = new ArrayList<>();

        // 检测是否以 --- 开头（允许前面有 BOM 或空白）
        String content = rawContent;
        // 去掉开头的 BOM 字符
        if (content.startsWith("\uFEFF")) {
            content = content.substring(1);
        }

        if (!content.startsWith("---")) {
            // 没有 frontmatter，整个内容作为 body
            result.body = content;
            // 尝试从第一个 # 标题提取 title
            result.title = extractTitleFromMarkdown(content);
            return result;
        }

        // 找到第二个 --- 的位置（frontmatter 结束标记）
        // 跳过第一个 ---，从下一行开始找
        int firstSeparatorEnd = content.indexOf('\n');
        if (firstSeparatorEnd < 0) {
            result.body = content;
            return result;
        }

        String afterFirstSeparator = content.substring(firstSeparatorEnd + 1);
        int secondSeparator = afterFirstSeparator.indexOf("\n---");
        if (secondSeparator < 0) {
            // 没有找到结束标记，整个内容作为 body
            result.body = content;
            return result;
        }

        // 提取 frontmatter 和 body
        String frontmatter = afterFirstSeparator.substring(0, secondSeparator);
        // body 从第二个 --- 之后开始，跳过该行
        int bodyStart = secondSeparator + 4; // "\n---".length
        // 跳过结束行的剩余部分（到下一个换行）
        int nextNewline = afterFirstSeparator.indexOf('\n', bodyStart);
        if (nextNewline >= 0) {
            result.body = afterFirstSeparator.substring(nextNewline + 1);
        } else {
            result.body = "";
        }

        // 逐行解析 frontmatter（简单 YAML key: value 格式）
        parseFrontmatterLines(frontmatter, result);

        // 如果 frontmatter 中没有 title，尝试从 body 提取
        if (result.title == null || result.title.isEmpty()) {
            result.title = extractTitleFromMarkdown(result.body);
        }

        return result;
    }

    /**
     * 逐行解析 frontmatter 的 key: value
     * 支持 tags 的两种格式：[a, b] 和多行 - item
     */
    private void parseFrontmatterLines(String frontmatter, FrontmatterParseResult result) {
        String[] lines = frontmatter.split("\n");
        String currentKey = null; // 用于处理多行 tags（- item 格式）

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;

            // 处理多行列表项（例如 tags 下的 - item）
            if (trimmed.startsWith("- ") && currentKey != null) {
                String value = trimmed.substring(2).trim();
                // 去掉引号
                value = stripQuotes(value);
                if ("tags".equals(currentKey)) {
                    result.tags.add(value);
                }
                continue;
            }

            // 解析 key: value
            int colonIdx = trimmed.indexOf(':');
            if (colonIdx < 0) continue;

            String key = trimmed.substring(0, colonIdx).trim();
            String value = trimmed.substring(colonIdx + 1).trim();

            switch (key) {
                case "title":
                    result.title = stripQuotes(value);
                    currentKey = null;
                    break;
                case "description":
                case "desc":
                case "summary":
                    result.description = stripQuotes(value);
                    currentKey = null;
                    break;
                case "cover":
                case "image":
                    result.cover = stripQuotes(value);
                    currentKey = null;
                    break;
                case "date":
                    result.date = parseDate(value);
                    currentKey = null;
                    break;
                case "tags":
                    // 如果 value 非空，说明是 [a, b] 格式
                    if (!value.isEmpty()) {
                        result.tags = parseTagArray(value);
                    }
                    // 否则是多行格式，记录 currentKey 供后续 - item 使用
                    currentKey = "tags";
                    break;
                default:
                    currentKey = null;
                    break;
            }
        }
    }

    /**
     * 解析 tags 的数组格式：[React, Spring Boot]
     * 返回 ["React", "Spring Boot"]
     */
    private List<String> parseTagArray(String value) {
        List<String> tags = new ArrayList<>();
        // 去掉方括号
        String inner = value;
        if (inner.startsWith("[")) inner = inner.substring(1);
        if (inner.endsWith("]")) inner = inner.substring(0, inner.length() - 1);

        // 按逗号分割
        if (!inner.trim().isEmpty()) {
            for (String tag : inner.split(",")) {
                String t = stripQuotes(tag.trim());
                if (!t.isEmpty()) tags.add(t);
            }
        }
        return tags;
    }

    /**
     * 去掉字符串两端的引号（单引号或双引号）
     */
    private String stripQuotes(String value) {
        if (value == null || value.length() < 2) return value;
        if ((value.startsWith("\"") && value.endsWith("\"")) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            return value.substring(1, value.length() - 1);
        }
        return value;
    }

    /**
     * 解析日期字符串为 LocalDateTime
     * 支持格式：2026-08-14 或 2026-08-14T10:30:00 或 2026-08-14 10:30:00
     */
    private LocalDateTime parseDate(String value) {
        if (value == null || value.isEmpty()) return null;
        try {
            // 去掉引号
            value = stripQuotes(value);
            // 尝试解析完整日期时间
            if (value.contains("T")) {
                return LocalDateTime.parse(value, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            }
            // 仅日期格式：补充时间为 00:00:00
            if (value.length() <= 10) {
                return LocalDate.parse(value, DateTimeFormatter.ISO_LOCAL_DATE).atStartOfDay();
            }
            // 带空格的日期时间
            return LocalDateTime.parse(value.replace(" ", "T"), DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 从 Markdown 正文中提取第一个 # 标题作为 title
     * 如果没有标题则返回 null
     */
    private String extractTitleFromMarkdown(String body) {
        if (body == null) return null;
        String[] lines = body.split("\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.startsWith("# ")) {
                return trimmed.substring(2).trim();
            }
        }
        return null;
    }

    /**
     * 从文件名生成 slug
     * 规则：去掉 .md 后缀，空格替换为连字符
     * 例如 "my-first-post.md" -> "my-first-post"
     */
    private String generateSlugFromFilename(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "post_" + System.currentTimeMillis();
        }
        // 去掉 .md 或 .markdown 后缀
        String name = filename;
        int dotIdx = name.lastIndexOf('.');
        if (dotIdx > 0) {
            name = name.substring(0, dotIdx);
        }
        // 空格替换为连字符
        return name.replace(' ', '-').replace('_', '-');
    }

    /**
     * 创建新文章（关联当前登录用户）
     *
     * @param userId  当前登录用户 ID
     * @param request 文章数据
     * @return 创建后的文章信息（含生成的 HTML 和 ID）
     */
    @Transactional
    public PostResponse createPost(Long userId, PostRequest request) {
        // 校验 slug 在当前用户范围内是否已存在（不同用户可以有相同 slug）
        if (postRepository.existsBySlugAndUserId(request.getSlug(), userId)) {
            throw new RuntimeException("Slug 已存在: " + request.getSlug());
        }

        // 将 Markdown 原文渲染为 HTML，存储 htmlContent 字段供前端直接展示
        String htmlContent = renderMarkdown(request.getContent());

        Post post = Post.builder()
                .slug(request.getSlug())
                .userId(userId)
                .title(request.getTitle())
                .description(request.getDescription())
                .content(request.getContent())
                .htmlContent(htmlContent)
                .tags(serializeTags(request.getTags()))
                .cover(request.getCover())
                .date(request.getDate() != null ? request.getDate() : java.time.LocalDateTime.now())
                .status(request.getStatus() != null ? request.getStatus() : "PUBLISHED")
                .views(0)
                .build();

        return toResponse(postRepository.save(post));
    }

    /**
     * 更新文章（仅允许作者本人操作，通过 slug + userId 组合校验越权）
     *
     * @param userId  当前登录用户 ID
     * @param slug    文章 slug
     * @param request 更新数据
     */
    @Transactional
    public PostResponse updatePost(Long userId, String slug, PostRequest request) {
        // 按 slug + userId 组合查询，如果文章不属于当前用户则抛出异常
        Post post = postRepository.findBySlugAndUserId(slug, userId)
                .orElseThrow(() -> new RuntimeException("文章不存在或无权操作: " + slug));

        post.setTitle(request.getTitle());
        post.setDescription(request.getDescription());
        post.setContent(request.getContent());
        // 内容变更后重新渲染 HTML
        post.setHtmlContent(renderMarkdown(request.getContent()));
        post.setTags(serializeTags(request.getTags()));
        post.setCover(request.getCover());
        if (request.getDate() != null) {
            post.setDate(request.getDate());
        }
        if (request.getStatus() != null) {
            post.setStatus(request.getStatus());
        }

        return toResponse(postRepository.save(post));
    }

    /**
     * 删除文章（仅允许作者本人操作）
     *
     * @param userId 当前登录用户 ID
     * @param slug   文章 slug
     */
    @Transactional
    public void deletePost(Long userId, String slug) {
        // 先校验归属权，再执行删除
        if (!postRepository.existsBySlugAndUserId(slug, userId)) {
            throw new RuntimeException("文章不存在或无权操作: " + slug);
        }
        postRepository.deleteBySlugAndUserId(slug, userId);
    }

    // ==================== 私有辅助方法 ====================

    /**
     * 将 Markdown 原文渲染为 HTML
     * 使用 commonmark 库，支持标准 Markdown 语法
     */
    private String renderMarkdown(String markdown) {
        if (markdown == null || markdown.isEmpty()) {
            return "";
        }
        Node document = markdownParser.parse(markdown);
        return htmlRenderer.render(document);
    }

    /**
     * 将 List<String> 序列化为 JSON 字符串存储到数据库
     * 例如 ["React","Spring Boot"] -> "[\"React\",\"Spring Boot\"]"
     * 空列表或 null 统一存储为 "[]"
     */
    private String serializeTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(tags);
        } catch (JsonProcessingException e) {
            // 序列化失败时降级为空数组，避免影响文章保存
            return "[]";
        }
    }

    /**
     * 将数据库中的 JSON 字符串反序列化为 List<String>
     * 例如 "[\"React\",\"Spring Boot\"]" -> ["React","Spring Boot"]
     * 解析失败时降级为空列表，保证前端不报错
     */
    private List<String> deserializeTags(String tagsJson) {
        if (tagsJson == null || tagsJson.isEmpty()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(tagsJson,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    /**
     * 将 Post 实体转换为 PostResponse DTO
     * 负责将 tags JSON 字符串反序列化为 List<String>
     */
    private PostResponse toResponse(Post post) {
        return PostResponse.builder()
                .id(post.getId())
                .slug(post.getSlug())
                .title(post.getTitle())
                .description(post.getDescription())
                .content(post.getContent())
                .htmlContent(post.getHtmlContent())
                .cover(post.getCover())
                .date(post.getDate())
                .status(post.getStatus())
                .views(post.getViews())
                .tags(deserializeTags(post.getTags()))
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
