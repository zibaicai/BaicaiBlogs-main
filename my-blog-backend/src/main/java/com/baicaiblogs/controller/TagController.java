package com.baicaiblogs.controller;

import com.baicaiblogs.dto.ApiResponse;
import com.baicaiblogs.dto.TagRequest;
import com.baicaiblogs.dto.TagResponse;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @GetMapping("/public/tags")
    public ApiResponse<List<TagResponse>> activeTags() {
        return ApiResponse.success(tagService.activeTags());
    }

    @PostMapping("/user/tags/request")
    public ApiResponse<TagResponse> requestTag(@RequestBody TagRequest request) {
        try {
            return ApiResponse.success("申请已提交", tagService.requestTag(currentUser().getId(), request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/admin/tags")
    public ApiResponse<List<TagResponse>> allTags() {
        return ApiResponse.success(tagService.allTags());
    }

    @PostMapping("/admin/tags")
    public ApiResponse<TagResponse> createTag(@RequestBody TagRequest request) {
        try {
            return ApiResponse.success("创建成功", tagService.createActive(request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/admin/tags/pending")
    public ApiResponse<List<TagResponse>> pendingTags() {
        return ApiResponse.success(tagService.pendingTags());
    }

    @GetMapping("/admin/tags/recommend")
    public ApiResponse<List<String>> recommend(@RequestParam(required = false) Long categoryId) {
        return ApiResponse.success(tagService.recommend(categoryId));
    }

    @PostMapping("/admin/tags/{id}/approve")
    public ApiResponse<TagResponse> approve(@PathVariable Long id) {
        try {
            return ApiResponse.success("已通过", tagService.approve(currentUser().getId(), id));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/tags/{id}/reject")
    public ApiResponse<TagResponse> reject(@PathVariable Long id, @RequestParam(required = false) String note) {
        try {
            return ApiResponse.success("已拒绝", tagService.reject(currentUser().getId(), id, note));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    private User currentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User user) return user;
        throw new RuntimeException("未登录");
    }
}
