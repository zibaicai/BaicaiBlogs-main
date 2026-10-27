package com.baicaiblogs.controller;

import com.baicaiblogs.dto.ApiResponse;
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
                                            HttpServletRequest httpRequest,
                                            HttpServletResponse httpResponse) {
        try {
            LoginResponse response = authService.login(request, clientIp(httpRequest));
            if (cookie) {
                boolean secure = "https".equalsIgnoreCase(httpRequest.getHeader("X-Forwarded-Proto"))
                        || httpRequest.isSecure();
                ResponseCookie c = ResponseCookie.from(JwtAuthenticationFilter.COOKIE_NAME, response.getToken())
                        .httpOnly(true)
                        .secure(secure)
                        .sameSite("Lax")
                        .path("/")
                        .maxAge(Duration.ofDays(7))
                        .build();
                httpResponse.addHeader(HttpHeaders.SET_COOKIE, c.toString());
            }
            return ApiResponse.success("登录成功", response);
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
        ResponseCookie c = ResponseCookie.from(JwtAuthenticationFilter.COOKIE_NAME, "")
                .httpOnly(true)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, c.toString());
        return ApiResponse.success("已退出", null);
    }
}
