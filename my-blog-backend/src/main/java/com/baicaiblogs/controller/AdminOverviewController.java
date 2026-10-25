package com.baicaiblogs.controller;

import com.baicaiblogs.dto.ApiResponse;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.service.AdminOverviewService;
import com.baicaiblogs.service.ImageWallService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminOverviewController {

    private final AdminOverviewService overviewService;
    private final ImageWallService imageWallService;

    @GetMapping("/overview")
    public ApiResponse<Map<String, Object>> overview() {
        try {
            User user = imageWallService.currentUser();
            return ApiResponse.success(overviewService.snapshot(user));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
