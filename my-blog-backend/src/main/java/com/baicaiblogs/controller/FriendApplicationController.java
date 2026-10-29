package com.baicaiblogs.controller;

import com.baicaiblogs.dto.ApiResponse;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.service.FriendApplicationService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FriendApplicationController {

    private static final String CLAIM_COOKIE = "FRIEND_CLAIM";

    private final FriendApplicationService service;

    @PostMapping("/public/friend-applications")
    public ApiResponse<Map<String, Object>> submit(
            @RequestBody Map<String, String> body,
            HttpServletRequest request,
            HttpServletResponse response) {
        try {
            String ip = clientIp(request);
            Map<String, Object> result = service.submit(body, ip, request.getHeader("User-Agent"), currentUser());
            String token = String.valueOf(result.get("claimToken"));
            Cookie cookie = new Cookie(CLAIM_COOKIE, token);
            cookie.setHttpOnly(true);
            cookie.setSecure("https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto")) || request.isSecure());
            cookie.setPath("/");
            cookie.setMaxAge(60 * 60 * 24 * 30);
            response.addCookie(cookie);
            return ApiResponse.success("申请已提交，等待管理员核验", result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/admin/friend-applications")
    public ApiResponse<List<Map<String, Object>>> pending() {
        try {
            return ApiResponse.success(service.pending());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/friend-applications/{id}/approve")
    public ApiResponse<Map<String, Object>> approve(@PathVariable Long id) {
        try {
            return ApiResponse.success("已通过", service.approve(id, currentUser()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/friend-applications/{id}/reject")
    public ApiResponse<Void> reject(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        try {
            service.reject(id, currentUser(), body == null ? null : body.get("note"));
            return ApiResponse.success("已拒绝", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/user/friend-application")
    public ApiResponse<Map<String, Object>> mine() {
        try {
            return ApiResponse.success(service.mine(currentUser()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/user/friend-application/bind")
    public ApiResponse<Map<String, Object>> bind(
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest request) {
        try {
            String token = body == null ? null : body.get("claimToken");
            if (token == null || token.isBlank()) token = claimCookie(request);
            return ApiResponse.success("绑定成功", service.bind(currentUser(), token));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    private User currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return null;
        }
        return user;
    }

    private String claimCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie cookie : cookies) {
            if (CLAIM_COOKIE.equals(cookie.getName())) return cookie.getValue();
        }
        return null;
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return forwarded == null || forwarded.isBlank() ? request.getRemoteAddr() : forwarded.split(",")[0].trim();
    }
}
