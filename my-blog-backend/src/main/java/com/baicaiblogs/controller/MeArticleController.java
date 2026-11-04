package com.baicaiblogs.controller;

import com.baicaiblogs.dto.ApiResponse;
import com.baicaiblogs.dto.ArticleDtos;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.service.ArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/me/articles")
@RequiredArgsConstructor
public class MeArticleController {

    private final ArticleService articleService;

    @GetMapping
    public ApiResponse<List<ArticleDtos.ArticleResponse>> list() {
        try {
            return ApiResponse.success(articleService.adminList(currentUser()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ApiResponse<ArticleDtos.ArticleResponse> get(@PathVariable Long id) {
        try {
            return ApiResponse.success(articleService.adminGet(currentUser(), id));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping
    public ApiResponse<ArticleDtos.ArticleResponse> create(@RequestBody ArticleDtos.ArticleRequest request) {
        try {
            return ApiResponse.success("创建成功", articleService.create(currentUser(), request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ApiResponse<ArticleDtos.ArticleResponse> update(@PathVariable Long id,
                                                           @RequestBody ArticleDtos.ArticleRequest request) {
        try {
            return ApiResponse.success("保存成功", articleService.update(currentUser(), id, request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/images")
    public ApiResponse<String> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            return ApiResponse.success("上传成功", articleService.uploadImage(currentUser(), file));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        try {
            articleService.delete(currentUser(), id);
            return ApiResponse.success("已删除", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    private User currentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication() == null
                ? null
                : SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User user) return user;
        throw new RuntimeException("未登录");
    }
}
