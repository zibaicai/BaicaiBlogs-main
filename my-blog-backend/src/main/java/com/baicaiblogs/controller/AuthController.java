package com.baicaiblogs.controller;

import com.baicaiblogs.dto.ApiResponse;
import com.baicaiblogs.dto.LoginRequest;
import com.baicaiblogs.dto.LoginResponse;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.security.JwtAuthenticationFilter;
import com.baicaiblogs.service.AuthService;
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

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestBody LoginRequest request,
                                            @RequestParam(defaultValue = "false") boolean cookie,
                                            HttpServletRequest httpRequest,
                                            HttpServletResponse httpResponse) {
        try {
            LoginResponse response = authService.login(request);
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
    public ApiResponse<Void> register(@RequestBody LoginRequest request) {
        try {
            authService.register(request);
            return ApiResponse.success("注册成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
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
