package com.baicaiblogs.controller;

import com.baicaiblogs.dto.*;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.service.AdminOverviewService;
import com.baicaiblogs.service.CategoryService;
import com.baicaiblogs.service.MomentService;
import com.baicaiblogs.service.PostService;
import com.baicaiblogs.service.ProjectService;
import com.baicaiblogs.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Personal workspace API. Every authenticated user can manage only their own resources.
 */
@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class MeController {

    private final AdminOverviewService overviewService;
    private final PostService postService;
    private final ProjectService projectService;
    private final MomentService momentService;
    private final CategoryService categoryService;
    private final TagService tagService;
    private final PostController postController;

    @GetMapping("/overview")
    public ApiResponse<Map<String, Object>> overview() {
        try {
            return ApiResponse.success(overviewService.snapshot(currentUser()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/posts")
    public ApiResponse<List<PostResponse>> posts() {
        try {
            return ApiResponse.success(postService.getPostsByUser(currentUser().getId()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/posts/all_tags")
    public ApiResponse<List<String>> postTags() {
        try {
            return ApiResponse.success(postService.getAllTagsByUser(currentUser().getId()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/posts/{slug}")
    public ApiResponse<PostResponse> post(@PathVariable String slug) {
        try {
            return ApiResponse.success(postService.getPostBySlugForUser(currentUser().getId(), slug));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/posts")
    public ApiResponse<PostResponse> createPost(@RequestBody PostRequest request) {
        try {
            return ApiResponse.success("创建成功", postService.createPost(currentUser().getId(), request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/posts/{slug}")
    public ApiResponse<PostResponse> updatePost(@PathVariable String slug, @RequestBody PostRequest request) {
        try {
            return ApiResponse.success("更新成功", postService.updatePost(currentUser().getId(), slug, request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/posts/{slug}")
    public ApiResponse<Void> deletePost(@PathVariable String slug) {
        try {
            postService.deletePost(currentUser().getId(), slug);
            return ApiResponse.success("删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/posts/upload")
    public ApiResponse<PostResponse> uploadPost(@RequestParam("file") MultipartFile file) {
        try {
            return ApiResponse.success(postService.uploadPost(currentUser().getId(), file));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PatchMapping("/posts/{slug}/visibility")
    public ApiResponse<PostResponse> postVisibility(@PathVariable String slug, @RequestBody Map<String, String> body) {
        try {
            return ApiResponse.success(postService.updateVisibility(currentUser().getId(), slug, body.get("visibility")));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/projects")
    public ApiResponse<List<ProjectResponse>> projects() {
        try {
            return ApiResponse.success(projectService.getProjectsByUser(currentUser().getId()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/projects")
    public ApiResponse<ProjectResponse> createProject(@RequestBody ProjectRequest request) {
        try {
            return ApiResponse.success(projectService.createProject(currentUser().getId(), request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/projects/{projectId}")
    public ApiResponse<ProjectResponse> updateProject(@PathVariable String projectId, @RequestBody ProjectRequest request) {
        try {
            return ApiResponse.success(projectService.updateProject(currentUser().getId(), projectId, request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/projects/{projectId}")
    public ApiResponse<Void> deleteProject(@PathVariable String projectId) {
        try {
            projectService.deleteProject(currentUser().getId(), projectId);
            return ApiResponse.success("删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PatchMapping("/projects/{projectId}/visibility")
    public ApiResponse<ProjectResponse> projectVisibility(@PathVariable String projectId,
                                                          @RequestBody Map<String, String> body) {
        try {
            return ApiResponse.success(projectService.updateVisibility(currentUser().getId(), projectId, body.get("visibility")));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/moments")
    public ApiResponse<List<MomentResponse>> moments() {
        try {
            return ApiResponse.success(momentService.getMyMoments(currentUser().getId()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/moments")
    public ApiResponse<MomentResponse> createMoment(@RequestBody MomentRequest request) {
        try {
            return ApiResponse.success(momentService.createMoment(currentUser().getId(), request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/moments/{slug}")
    public ApiResponse<MomentResponse> updateMoment(@PathVariable String slug, @RequestBody MomentRequest request) {
        try {
            return ApiResponse.success(momentService.updateMoment(currentUser().getId(), slug, request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/moments/{slug}")
    public ApiResponse<Void> deleteMoment(@PathVariable String slug) {
        try {
            momentService.deleteMoment(currentUser().getId(), slug);
            return ApiResponse.success("删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/categories")
    public ApiResponse<List<CategoryResponse>> categories() {
        try {
            return ApiResponse.success(categoryService.listAll());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/tags")
    public ApiResponse<List<TagResponse>> tags() {
        try {
            return ApiResponse.success(tagService.allTags());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/tags/recommend")
    public ApiResponse<List<String>> recommendTags(@RequestParam(required = false) Long categoryId) {
        try {
            return ApiResponse.success(tagService.recommend(categoryId));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/images")
    public ApiResponse<String> uploadImage(@RequestParam("file") MultipartFile file) {
        return postController.uploadImage(file);
    }

    @PostMapping("/backgrounds")
    public ApiResponse<String> uploadBackground(@RequestParam("file") MultipartFile file) {
        return postController.uploadBackground(file);
    }

    private User currentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication() == null
                ? null
                : SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User user) return user;
        throw new RuntimeException("未登录");
    }
}
