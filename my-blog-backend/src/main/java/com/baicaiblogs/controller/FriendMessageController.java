package com.baicaiblogs.controller;

import com.baicaiblogs.dto.ApiResponse;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.service.FriendMessageService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FriendMessageController {

    private final FriendMessageService service;

    @GetMapping("/public/friend-messages")
    public ApiResponse<List<Map<String, Object>>> messages() {
        try {
            return ApiResponse.success(service.publicMessages());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/public/friend-messages")
    public ApiResponse<Map<String, Object>> submit(@RequestBody Map<String, String> body, HttpServletRequest request) {
        try {
            String ip = clientIp(request);
            return ApiResponse.success("留言已发布", service.submit(body, ip, request.getHeader("User-Agent"), optionalUser()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/admin/friend-messages")
    public ApiResponse<List<Map<String, Object>>> pending() {
        try {
            return ApiResponse.success(service.pendingMessages());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/friend-messages/{id}/approve")
    public ApiResponse<Void> approve(@PathVariable Long id) {
        try {
            service.approve(id, currentUser());
            return ApiResponse.success("已通过", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/friend-messages/{id}/reject")
    public ApiResponse<Void> reject(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        try {
            service.reject(id, currentUser(), body == null ? null : body.get("note"));
            return ApiResponse.success("已拒绝", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/friend-messages/{id}/promote")
    public ApiResponse<Map<String, Object>> promote(@PathVariable Long id) {
        try {
            return ApiResponse.success("已收录为友链", service.promote(id, currentUser()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/admin/friend-messages/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ApiResponse.success("已删除", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/user/friend-messages/{id}")
    public ApiResponse<Void> deleteOwn(@PathVariable Long id) {
        try {
            service.deleteOwn(currentUser(), id);
            return ApiResponse.success("已删除", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    private User currentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User user) return user;
        throw new RuntimeException("用户未登录");
    }

    private User optionalUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return principal instanceof User user ? user : null;
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return forwarded == null || forwarded.isBlank() ? request.getRemoteAddr() : forwarded.split(",")[0].trim();
    }
}
