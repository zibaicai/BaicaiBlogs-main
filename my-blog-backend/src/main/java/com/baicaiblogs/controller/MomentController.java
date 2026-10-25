package com.baicaiblogs.controller;

import com.baicaiblogs.dto.*;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.service.MomentService;
import com.baicaiblogs.service.PrivateMomentAuditService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MomentController {

    private final MomentService momentService;
    private final PrivateMomentAuditService privateMomentAuditService;

    @GetMapping("/public/moments")
    public ApiResponse<List<MomentResponse>> getAllMoments() {
        try {
            return ApiResponse.success(momentService.getAllMoments());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/user/moments")
    public ApiResponse<List<MomentResponse>> getCurrentUserMoments() {
        try {
            return ApiResponse.success(momentService.getMomentsForUser(getCurrentUserId()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/admin/moments/mine")
    public ApiResponse<List<MomentResponse>> getMyMoments() {
        try {
            return ApiResponse.success(momentService.getMyMoments(getCurrentUserId()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/moments")
    public ApiResponse<MomentResponse> createMoment(@RequestBody MomentRequest request) {
        try {
            return ApiResponse.success("创建成功", momentService.createMoment(getCurrentUserId(), request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/admin/moments/{slug}")
    public ApiResponse<MomentResponse> updateMoment(@PathVariable String slug,
                                                    @RequestBody MomentRequest request) {
        try {
            return ApiResponse.success("更新成功", momentService.updateMoment(getCurrentUserId(), slug, request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/admin/moments/{slug}")
    public ApiResponse<Void> deleteMoment(@PathVariable String slug) {
        try {
            momentService.deleteMoment(getCurrentUserId(), slug);
            return ApiResponse.success("删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/admin/moments/private")
    public ApiResponse<List<MomentResponse>> privateMoments(@RequestParam String reason,
                                                            HttpServletRequest request) {
        try {
            User operator = currentUser();
            if (!"SUPER_ADMIN".equals(operator.getRole())) {
                throw new RuntimeException("仅超级管理员可执行隐私审计");
            }
            if (reason == null || reason.isBlank()) {
                throw new RuntimeException("请填写查看原因");
            }
            List<MomentResponse> moments = momentService.getPrivateMomentsForAudit();
            String ip = request.getHeader("X-Forwarded-For");
            if (ip == null || ip.isBlank()) ip = request.getRemoteAddr();
            for (MomentResponse moment : moments) {
                privateMomentAuditService.record(operator,
                        com.baicaiblogs.entity.Moment.builder().id(moment.getId()).build(), reason, ip);
            }
            return ApiResponse.success(moments);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    private User currentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User user) return user;
        throw new RuntimeException("未登录");
    }

    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User user) {
            return user.getId();
        }
        throw new RuntimeException("未登录");
    }
}
