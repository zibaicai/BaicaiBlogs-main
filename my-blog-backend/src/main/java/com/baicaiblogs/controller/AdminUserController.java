package com.baicaiblogs.controller;

import com.baicaiblogs.dto.ApiResponse;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.repository.UserRepository;
import com.baicaiblogs.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;
    private final AuthService authService;

    @PostMapping("/{id}/password/reset")
    public ApiResponse<Map<String, Object>> resetPassword(@PathVariable Long id) {
        try {
            Object principal = SecurityContextHolder.getContext().getAuthentication() == null
                    ? null
                    : SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            if (!(principal instanceof User admin) || !"SUPER_ADMIN".equalsIgnoreCase(admin.getRole())) {
                return ApiResponse.error("只有超级管理员可以重置密码");
            }
            User target = userRepository.findById(id).orElse(null);
            if (target == null) return ApiResponse.error("用户不存在");
            String tempPassword = authService.resetPassword(target);
            return ApiResponse.success("密码已重置，请让用户登录后立即修改", Map.of(
                    "username", target.getUsername(),
                    "temporaryPassword", tempPassword
            ));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
