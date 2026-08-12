package com.baicaiblogs.controller;

import com.baicaiblogs.dto.*;
import com.baicaiblogs.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @GetMapping("/public/posts")
    public ApiResponse<List<PostResponse>> getAllPosts() {
        try {
            return ApiResponse.success(postService.getAllPosts());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

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

    @GetMapping("/public/posts/{slug}")
    public ApiResponse<PostResponse> getPostBySlug(@PathVariable String slug) {
        try {
            return ApiResponse.success(postService.getPostBySlug(slug));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/public/posts/search")
    public ApiResponse<List<PostResponse>> searchPosts(@RequestParam String keyword) {
        try {
            return ApiResponse.success(postService.searchPosts(keyword));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/posts")
    public ApiResponse<PostResponse> createPost(@RequestBody PostRequest request) {
        try {
            return ApiResponse.success("创建成功", postService.createPost(request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/admin/posts/{slug}")
    public ApiResponse<PostResponse> updatePost(@PathVariable String slug,
                                                 @RequestBody PostRequest request) {
        try {
            return ApiResponse.success("更新成功", postService.updatePost(slug, request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/admin/posts/{slug}")
    public ApiResponse<Void> deletePost(@PathVariable String slug) {
        try {
            postService.deletePost(slug);
            return ApiResponse.success("删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
