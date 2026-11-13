package com.baicaiblogs.controller;

import com.baicaiblogs.dto.ApiResponse;
import com.baicaiblogs.dto.ChangePasswordRequest;
import com.baicaiblogs.dto.LoginRequest;
import com.baicaiblogs.dto.LoginResponse;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.security.JwtAuthenticationFilter;
import com.baicaiblogs.service.AuthService;
import com.baicaiblogs.service.TurnstileService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final TurnstileService turnstileService;

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestBody LoginRequest request,
                                            @RequestParam(defaultValue = "false") boolean cookie,
                                            @RequestParam(defaultValue = "false") boolean adminCookie,
                                            HttpServletRequest httpRequest,
                                            HttpServletResponse httpResponse) {
        try {
            LoginResponse response = authService.login(request, clientIp(httpRequest));
            if (cookie && response.getToken() != null && !response.getToken().isBlank()) {
                boolean secure = "https".equalsIgnoreCase(httpRequest.getHeader("X-Forwarded-Proto"))
                        || httpRequest.isSecure();
                String host = httpRequest.getServerName() == null ? "" : httpRequest.getServerName().toLowerCase();
                ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(
                                adminCookie ? JwtAuthenticationFilter.ADMIN_COOKIE_NAME : JwtAuthenticationFilter.COOKIE_NAME,
                                response.getToken())
                        .httpOnly(true)
                        .secure(secure)
                        .sameSite("Lax")
                        .path("/")
                        .maxAge(Duration.ofDays(7));
                if (adminCookie && (host.equals("zibaicai.cn") || host.endsWith(".zibaicai.cn"))) {
                    builder.domain(".zibaicai.cn");
                }
                ResponseCookie c = builder.build();
                httpResponse.addHeader(HttpHeaders.SET_COOKIE, c.toString());
            }
            return ApiResponse.success("登录成功", response);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/password")
    public ApiResponse<Void> changePassword(@RequestBody ChangePasswordRequest body, HttpServletResponse response) {
        try {
            authService.changePassword(currentUser(), body.currentPassword(), body.newPassword());
            clearAuthCookies(response);
            return ApiResponse.success("密码已修改，请重新登录", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/2fa/verify")
    public ApiResponse<LoginResponse> verifyTwoFactor(@RequestBody Map<String, String> body,
                                                      HttpServletRequest httpRequest,
                                                      HttpServletResponse httpResponse) {
        try {
            LoginResponse response = authService.verifyTwoFactor(body.get("challengeToken"), body.get("code"));
            if (response.getToken() != null) {
                setAdminCookie(httpRequest, httpResponse, response.getToken());
            }
            return ApiResponse.success("登录成功", response);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/2fa/setup")
    public ApiResponse<Map<String, Object>> setupTwoFactor() {
        try {
            User user = currentUser();
            return ApiResponse.success(authService.setupTotp(user));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/2fa/enable")
    public ApiResponse<Void> enableTwoFactor(@RequestBody Map<String, String> body) {
        try {
            authService.enableTotp(currentUser(), body.get("code"));
            return ApiResponse.success("二次验证已启用", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/2fa/disable")
    public ApiResponse<Void> disableTwoFactor(@RequestBody Map<String, String> body) {
        try {
            authService.disableTotp(currentUser(), body.get("password"));
            return ApiResponse.success("二次验证已关闭", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/register")
    public ApiResponse<Void> register(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        try {
            authService.register(request, clientIp(httpRequest));
            return ApiResponse.success("注册成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/config")
    public ApiResponse<Map<String, Object>> registrationConfig() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("turnstileEnabled", turnstileService.isConfigured());
        data.put("turnstileSiteKey", turnstileService.getSiteKey());
        return ApiResponse.success(data);
    }

    @GetMapping("/me")
    public ApiResponse<Map<String, Object>> me() {
        Object principal = SecurityContextHolder.getContext().getAuthentication() == null
                ? null
                : SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof User user)) {
            return ApiResponse.error("未登录");
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", user.getId());
        data.put("username", user.getUsername());
        data.put("nickname", user.getNickname() != null ? user.getNickname() : user.getUsername());
        data.put("avatar", user.getAvatar());
        data.put("role", user.getRole());
        data.put("status", user.getStatus());
        data.put("createdAt", user.getCreatedAt());
        return ApiResponse.success(data);
    }

    private User currentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication() == null
                ? null
                : SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof User user)) throw new RuntimeException("请先登录");
        return user;
    }

    private boolean isAdmin(User user) {
        return user != null && ("ADMIN".equalsIgnoreCase(user.getRole()) || "SUPER_ADMIN".equalsIgnoreCase(user.getRole()));
    }

    private void clearAuthCookies(HttpServletResponse response) {
        ResponseCookie user = ResponseCookie.from(JwtAuthenticationFilter.COOKIE_NAME, "")
                .httpOnly(true).path("/").maxAge(0).sameSite("Lax").build();
        ResponseCookie admin = ResponseCookie.from(JwtAuthenticationFilter.ADMIN_COOKIE_NAME, "")
                .httpOnly(true).path("/").maxAge(0).sameSite("Lax").domain(".zibaicai.cn").build();
        response.addHeader(HttpHeaders.SET_COOKIE, user.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, admin.toString());
    }

    private void setAdminCookie(HttpServletRequest request, HttpServletResponse response, String token) {
        boolean secure = "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto")) || request.isSecure();
        String host = request.getServerName() == null ? "" : request.getServerName().toLowerCase();
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(
                        JwtAuthenticationFilter.ADMIN_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofSeconds(7200));
        if (host.equals("zibaicai.cn") || host.endsWith(".zibaicai.cn")) {
            builder.domain(".zibaicai.cn");
        }
        response.addHeader(HttpHeaders.SET_COOKIE, builder.build().toString());
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String real = request.getHeader("X-Real-IP");
        return real == null || real.isBlank() ? request.getRemoteAddr() : real.trim();
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        ResponseCookie userCookie = ResponseCookie.from(JwtAuthenticationFilter.COOKIE_NAME, "")
                .httpOnly(true)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, userCookie.toString());

        ResponseCookie.ResponseCookieBuilder adminBuilder = ResponseCookie.from(JwtAuthenticationFilter.ADMIN_COOKIE_NAME, "")
                .httpOnly(true)
                .path("/")
                .maxAge(0)
                .sameSite("Lax");
        String host = request.getServerName() == null ? "" : request.getServerName().toLowerCase();
        if (host.equals("zibaicai.cn") || host.endsWith(".zibaicai.cn")) {
            adminBuilder.domain(".zibaicai.cn");
        }
        response.addHeader(HttpHeaders.SET_COOKIE, adminBuilder.build().toString());
        return ApiResponse.success("已退出", null);
    }
}
