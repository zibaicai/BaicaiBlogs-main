package com.baicaiblogs.controller;

import com.baicaiblogs.dto.ApiResponse;
import com.baicaiblogs.entity.SensitiveAccessRequest;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.repository.UserRepository;
import com.baicaiblogs.service.SensitiveAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/sensitive-access")
@RequiredArgsConstructor
public class SensitiveAccessController {

    private final SensitiveAccessService accessService;
    private final UserRepository userRepository;

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list(Authentication authentication) {
        try {
            return ApiResponse.success(accessService.serialize(accessService.list(currentUser(authentication))));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping
    public ApiResponse<SensitiveAccessRequest> request(@RequestBody Map<String, String> body,
                                                        Authentication authentication) {
        try {
            String resourceType = body.getOrDefault("resourceType", "site_social");
            String reason = body.get("reason");
            return ApiResponse.success(accessService.request(currentUser(authentication), resourceType, reason));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/{id}/approve")
    public ApiResponse<SensitiveAccessRequest> approve(@PathVariable Long id, Authentication authentication) {
        try {
            return ApiResponse.success(accessService.approve(currentUser(authentication), id));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/{id}/reject")
    public ApiResponse<SensitiveAccessRequest> reject(@PathVariable Long id, Authentication authentication) {
        try {
            return ApiResponse.success(accessService.reject(currentUser(authentication), id));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    private User currentUser(Authentication authentication) {
        if (authentication == null) throw new RuntimeException("未登录");
        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) return user;
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("用户不存在"));
    }
}
