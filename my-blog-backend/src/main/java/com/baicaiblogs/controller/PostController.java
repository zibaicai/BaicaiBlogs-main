package com.baicaiblogs.controller;

import com.baicaiblogs.dto.*;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 文章控制器
 *
 * 端点分两类：
 * 1. /api/public/posts/**  —— 公开接口，访客无需登录即可浏览所有已发布文章
 * 2. /api/admin/posts/**  —— 管理接口，需要 JWT 认证，且所有操作按当前登录用户 ID 隔离
 *
 * 当前登录用户 ID 通过 Spring Security 的 SecurityContext 获取（由 JwtAuthenticationFilter 设置）。
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    // ==================== 公开接口（无需登录） ====================

    /** 获取所有已发布文章（不分用户） */
    @GetMapping("/public/posts")
    public ApiResponse<List<PostResponse>> getAllPosts() {
        try {
            return ApiResponse.success(postService.getAllPosts());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /** 分页获取已发布文章 */
    @GetMapping("/public/posts/page")
    public ApiResponse<PageResponse<PostResponse>> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            return ApiResponse.success(postService.getPosts(page, size));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /** 按 slug 获取单篇文章详情 */
    @GetMapping("/public/posts/{slug}")
    public ApiResponse<PostResponse> getPostBySlug(@PathVariable String slug) {
        try {
            return ApiResponse.success(postService.getPostBySlug(slug));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /** 搜索已发布文章（按标题和描述模糊匹配） */
    @GetMapping("/public/posts/search")
    public ApiResponse<List<PostResponse>> searchPosts(@RequestParam String keyword) {
        try {
            return ApiResponse.success(postService.searchPosts(keyword));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    // ==================== 管理接口（需要登录，按用户隔离） ====================

    /**
     * 获取当前登录用户的已发布文章列表
     * 用于前端时间线页面（/timeline）展示该用户自己的文章
     */
    @GetMapping("/admin/posts/mine")
    public ApiResponse<List<PostResponse>> getMyPosts() {
        try {
            Long userId = getCurrentUserId();
            return ApiResponse.success(postService.getPostsByUser(userId));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 获取当前登录用户所有文章中出现过的 tag 集合（去重）
     * 用于编辑器标签历史提示功能
     */
    @GetMapping("/admin/posts/all_tags")
    public ApiResponse<List<String>> getAllTags() {
        try {
            Long userId = getCurrentUserId();
            return ApiResponse.success(postService.getAllTagsByUser(userId));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 按 slug 获取当前登录用户的单篇文章（编辑器加载用）
     * 不限发布状态，DRAFT 状态的文章也能加载
     */
    @GetMapping("/admin/posts/{slug}")
    public ApiResponse<PostResponse> getMyPostBySlug(@PathVariable String slug) {
        try {
            Long userId = getCurrentUserId();
            return ApiResponse.success(postService.getPostBySlugForUser(userId, slug));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 上传 Markdown 文件并导入为文章
     * 接收 multipart/form-data 格式的 .md 文件
     * 后端解析 frontmatter（title/date/tags/cover/description）并存入数据库
     *
     * 使用场景：用户在时间线页面点击"上传 MD"按钮，选择本地 .md 文件直接导入
     */
    @PostMapping("/admin/posts/upload")
    public ApiResponse<PostResponse> uploadPost(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ApiResponse.error("文件不能为空");
            }
            // 校验文件扩展名
            String filename = file.getOriginalFilename();
            if (filename == null || (!filename.endsWith(".md") && !filename.endsWith(".markdown"))) {
                return ApiResponse.error("仅支持 .md 或 .markdown 文件");
            }
            Long userId = getCurrentUserId();
            return ApiResponse.success("上传成功", postService.uploadPost(userId, file));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 创建新文章
     * 文章会自动关联到当前登录用户（userId 从 JWT 中提取，不由前端传入，防止伪造）
     */
    @PostMapping("/admin/posts")
    public ApiResponse<PostResponse> createPost(@RequestBody PostRequest request) {
        try {
            Long userId = getCurrentUserId();
            return ApiResponse.success("创建成功", postService.createPost(userId, request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 更新文章
     * 仅允许文章作者本人操作，Service 层会按 slug + userId 组合校验越权
     */
    @PutMapping("/admin/posts/{slug}")
    public ApiResponse<PostResponse> updatePost(@PathVariable String slug,
                                                 @RequestBody PostRequest request) {
        try {
            Long userId = getCurrentUserId();
            return ApiResponse.success("更新成功", postService.updatePost(userId, slug, request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 删除文章
     * 仅允许文章作者本人操作，Service 层会按 slug + userId 组合校验越权
     */
    @DeleteMapping("/admin/posts/{slug}")
    public ApiResponse<Void> deletePost(@PathVariable String slug) {
        try {
            Long userId = getCurrentUserId();
            postService.deletePost(userId, slug);
            return ApiResponse.success("删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    // ==================== 辅助方法 ====================

    /**
     * 从 Spring Security 上下文获取当前登录用户 ID
     * JwtAuthenticationFilter 在验证 token 后会将 User 实体设为 Authentication 的 principal
     *
     * @return 当前登录用户的 ID
     * @throws RuntimeException 如果用户未登录或 principal 类型不匹配
     */
    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User) {
            return ((User) principal).getId();
        }
        throw new RuntimeException("用户未登录");
    }
}
