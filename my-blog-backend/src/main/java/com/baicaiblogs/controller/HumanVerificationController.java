package com.baicaiblogs.controller;

import com.baicaiblogs.dto.ApiResponse;
import com.baicaiblogs.service.HumanVerificationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/public/human")
@RequiredArgsConstructor
public class HumanVerificationController {

    private final HumanVerificationService humanVerificationService;

    @PostMapping("/verify")
    public ApiResponse<Map<String, Object>> verify(
            @RequestBody Map<String, String> body,
            HttpServletRequest request,
            HttpServletResponse response) {
        try {
            HumanVerificationService.Session session = humanVerificationService.verifyAndCreate(
                    body.get("token"), clientIp(request));
            response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from(HumanVerificationService.COOKIE_NAME, session.id())
                    .httpOnly(true)
                    .secure("https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto")) || request.isSecure())
                    .sameSite("Lax")
                    .path("/")
                    .maxAge(HumanVerificationService.TTL)
                    .build()
                    .toString());
            return ApiResponse.success("验证通过", payload(session));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/status")
    public ApiResponse<Map<String, Object>> status(HttpServletRequest request) {
        HumanVerificationService.Session session = humanVerificationService.find(request);
        if (session == null) {
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("verified", false);
            data.put("remaining", 0);
            data.put("expiresAt", null);
            return ApiResponse.success(data);
        }
        return ApiResponse.success(payload(session));
    }

    private Map<String, Object> payload(HumanVerificationService.Session session) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("verified", true);
        data.put("remaining", session.remaining());
        data.put("expiresAt", session.expiresAt().toString());
        return data;
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) return forwarded.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
