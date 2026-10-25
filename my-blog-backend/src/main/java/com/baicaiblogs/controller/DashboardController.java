package com.baicaiblogs.controller;

import com.baicaiblogs.dto.ApiResponse;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.service.DashboardService;
import com.baicaiblogs.service.ImageWallService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final ImageWallService imageWallService;

    @PostMapping("/public/visit")
    public ApiResponse<Void> visit() {
        try {
            dashboardService.recordVisit();
            return ApiResponse.success("记录成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/public/dashboard")
    public ApiResponse<Map<String, Object>> dashboard() {
        try {
            return ApiResponse.success(dashboardService.snapshot());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/online/heartbeat")
    public ApiResponse<Void> heartbeat(@RequestBody(required = false) Map<String, String> body) {
        try {
            User user = imageWallService.currentUser();
            dashboardService.heartbeat(user, body == null ? null : body.get("path"));
            return ApiResponse.success("在线状态已更新", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
