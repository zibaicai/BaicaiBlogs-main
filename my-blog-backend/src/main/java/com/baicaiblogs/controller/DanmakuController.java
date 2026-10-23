package com.baicaiblogs.controller;

import com.baicaiblogs.dto.ApiResponse;
import com.baicaiblogs.dto.DanmakuResponse;
import com.baicaiblogs.dto.ImageDtos;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.service.DanmakuService;
import com.baicaiblogs.service.ImageWallService;
import com.baicaiblogs.service.IpBanService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DanmakuController {

    private final DanmakuService danmakuService;
    private final ImageWallService imageWallService;

    @GetMapping("/public/danmaku")
    public ApiResponse<List<String>> publicList() {
        return ApiResponse.success(danmakuService.publicList());
    }

    @PostMapping("/public/danmaku")
    public ApiResponse<String> send(@RequestBody ImageDtos.DanmakuRequest body, HttpServletRequest request) {
        try {
            User user = imageWallService.currentUser();
            String ip = request.getHeader("X-Forwarded-For");
            if (ip == null || ip.isBlank()) ip = request.getRemoteAddr();
            if (ip != null && ip.contains(",")) ip = ip.split(",")[0].trim();
            danmakuService.add(user, body == null ? null : body.getText(), IpBanService.hash(ip));
            return ApiResponse.success("弹幕已发射", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/admin/danmaku")
    public ApiResponse<List<DanmakuResponse>> adminList() {
        return ApiResponse.success(danmakuService.adminList());
    }

    @DeleteMapping("/admin/danmaku/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        try {
            danmakuService.delete(id);
            return ApiResponse.success("已删除", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
