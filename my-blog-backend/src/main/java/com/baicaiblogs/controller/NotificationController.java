package com.baicaiblogs.controller;

import com.baicaiblogs.dto.ApiResponse;
import com.baicaiblogs.dto.NotificationPage;
import com.baicaiblogs.dto.NotificationResponse;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/me/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<NotificationPage> list(
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            var result = notificationService.page(currentUser(), category, page, size);
            return ApiResponse.success(NotificationPage.builder()
                    .items(result.getContent().stream().map(NotificationResponse::from).toList())
                    .page(result.getNumber() + 1)
                    .size(result.getSize())
                    .total(result.getTotalElements())
                    .totalPages(result.getTotalPages())
                    .build());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/preferences")
    public ApiResponse<Map<String, Boolean>> preferences() {
        try {
            return ApiResponse.success(notificationService.preferences(currentUser()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/preferences")
    public ApiResponse<Map<String, Boolean>> updatePreferences(@RequestBody Map<String, Boolean> values) {
        try {
            return ApiResponse.success(notificationService.updatePreferences(currentUser(), values));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/preferences")
    public ApiResponse<Map<String, Boolean>> resetPreferences() {
        try {
            return ApiResponse.success(notificationService.resetPreferences(currentUser()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/summary")
    public ApiResponse<Map<String, Long>> summary() {
        try {
            return ApiResponse.success(notificationService.summary(currentUser()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/{id}/read")
    public ApiResponse<Void> read(@PathVariable Long id) {
        try {
            notificationService.markRead(currentUser(), id);
            return ApiResponse.success("已读", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/read-all")
    public ApiResponse<Void> readAll(@RequestParam(required = false) String category) {
        try {
            notificationService.markAllRead(currentUser(), category);
            return ApiResponse.success("已全部标记为已读", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        try {
            notificationService.delete(currentUser(), id);
            return ApiResponse.success("已删除", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    private User currentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication() == null
                ? null
                : SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User user) return user;
        throw new RuntimeException("未登录");
    }
}
