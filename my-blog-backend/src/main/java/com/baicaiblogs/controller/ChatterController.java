package com.baicaiblogs.controller;

import com.baicaiblogs.dto.*;
import com.baicaiblogs.service.ChatterService;
import lombok.RequiredArgsConstructor;
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

    @PostMapping("/admin/chatters")
    public ApiResponse<ChatterResponse> createChatter(@RequestBody ChatterRequest request) {
        try {
            return ApiResponse.success("创建成功", chatterService.createChatter(request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/admin/chatters/{slug}")
    public ApiResponse<ChatterResponse> updateChatter(@PathVariable String slug,
                                                      @RequestBody ChatterRequest request) {
        try {
            return ApiResponse.success("更新成功", chatterService.updateChatter(slug, request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/admin/chatters/{slug}")
    public ApiResponse<Void> deleteChatter(@PathVariable String slug) {
        try {
            chatterService.deleteChatter(slug);
            return ApiResponse.success("删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
