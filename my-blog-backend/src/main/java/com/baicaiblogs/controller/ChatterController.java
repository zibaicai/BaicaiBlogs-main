package com.baicaiblogs.controller;

import com.baicaiblogs.dto.*;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.service.ChatterService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ChatterController {

    private final ChatterService chatterService;

    @GetMapping("/public/chatters")
    public ApiResponse<List<ChatterResponse>> getAllChatters() {
        try {
            return ApiResponse.success(chatterService.getAllChatters());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/public/chatters/page")
    public ApiResponse<PageResponse<ChatterResponse>> getChatters(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            return ApiResponse.success(chatterService.getChatters(page, size));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/public/chatters/{slug}")
    public ApiResponse<ChatterResponse> getChatterBySlug(@PathVariable String slug) {
        try {
            return ApiResponse.success(chatterService.getChatterBySlug(slug));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /** C 端登录用户：公开 + 自己的私密 */
    @GetMapping("/user/chatters")
    public ApiResponse<List<ChatterResponse>> getChattersForCurrentUser() {
        try {
            return ApiResponse.success(chatterService.getChattersForUser(getCurrentUserId()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /** 管理端：当前用户全部说说，包括草稿、私密、公开 */
    @GetMapping("/admin/chatters/mine")
    public ApiResponse<List<ChatterResponse>> getMyChatters() {
        try {
            return ApiResponse.success(chatterService.getMyChatters(getCurrentUserId()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/chatters")
    public ApiResponse<ChatterResponse> createChatter(@RequestBody ChatterRequest request) {
        try {
            return ApiResponse.success("创建成功", chatterService.createChatter(getCurrentUserId(), request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/admin/chatters/{slug}")
    public ApiResponse<ChatterResponse> updateChatter(@PathVariable String slug,
                                                      @RequestBody ChatterRequest request) {
        try {
            return ApiResponse.success("更新成功", chatterService.updateChatter(getCurrentUserId(), slug, request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/admin/chatters/{slug}")
    public ApiResponse<Void> deleteChatter(@PathVariable String slug) {
        try {
            chatterService.deleteChatter(getCurrentUserId(), slug);
            return ApiResponse.success("删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User user) {
            return user.getId();
        }
        throw new RuntimeException("未登录");
    }
}
