package com.baicaiblogs.controller;

import com.baicaiblogs.dto.ApiResponse;
import com.baicaiblogs.dto.ArticleDtos;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.repository.UserRepository;
import com.baicaiblogs.service.ArticleService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ArticleController {

    private final ArticleService articleService;
    private final UserRepository userRepository;

    @GetMapping("/public/articles")
    public ApiResponse<List<ArticleDtos.ArticleResponse>> publicList(
            @RequestParam(defaultValue = "all") String scope,
            Authentication authentication,
            HttpServletResponse response) {
        try {
            if ("mine".equalsIgnoreCase(scope)) {
                User user = currentUser(authentication);
                if (user == null) return ApiResponse.error("用户未登录");
                response.setHeader("Cache-Control", "private, no-store");
                response.setHeader("Vary", "Cookie");
                return ApiResponse.success(articleService.publicListByUser(user.getId()));
            }
            return ApiResponse.success(articleService.publicList());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/public/articles/{slug}")
    public ApiResponse<ArticleDtos.ArticleResponse> publicGet(@PathVariable String slug) {
        try {
            return ApiResponse.success(articleService.publicGet(slug));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/public/articles/images")
    public ResponseEntity<byte[]> publicImage(@RequestParam String key) {
        try {
            byte[] bytes = articleService.imageBytes(key);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(articleService.imageContentType(key)))
                    .contentLength(bytes.length)
                    .cacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePublic())
                    .header("X-Content-Type-Options", "nosniff")
                    .body(bytes);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/admin/articles")
    public ApiResponse<List<ArticleDtos.ArticleResponse>> adminList(Authentication authentication) {
        try {
            return ApiResponse.success(articleService.adminList(currentUser(authentication)));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/admin/articles/{id}")
    public ApiResponse<ArticleDtos.ArticleResponse> adminGet(@PathVariable Long id, Authentication authentication) {
        try {
            return ApiResponse.success(articleService.adminGet(currentUser(authentication), id));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/articles")
    public ApiResponse<ArticleDtos.ArticleResponse> create(@RequestBody ArticleDtos.ArticleRequest request,
                                                           Authentication authentication) {
        try {
            return ApiResponse.success(articleService.create(currentUser(authentication), request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/admin/articles/{id}")
    public ApiResponse<ArticleDtos.ArticleResponse> update(@PathVariable Long id,
                                                           @RequestBody ArticleDtos.ArticleRequest request,
                                                           Authentication authentication) {
        try {
            return ApiResponse.success(articleService.update(currentUser(authentication), id, request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/articles/images")
    public ApiResponse<String> uploadImage(@RequestParam("file") MultipartFile file,
                                           Authentication authentication) {
        try {
            return ApiResponse.success(articleService.uploadImage(currentUser(authentication), file));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/admin/articles/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id, Authentication authentication) {
        try {
            articleService.delete(currentUser(authentication), id);
            return ApiResponse.success("已删除", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    private User currentUser(Authentication authentication) {
        if (authentication == null) return null;
        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) return user;
        return userRepository.findByUsername(authentication.getName()).orElse(null);
    }
}
