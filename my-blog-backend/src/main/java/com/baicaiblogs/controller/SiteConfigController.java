package com.baicaiblogs.controller;

import com.baicaiblogs.dto.*;
import com.baicaiblogs.service.SiteConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SiteConfigController {

    private final SiteConfigService siteConfigService;

    @GetMapping("/public/config")
    public ApiResponse<List<SiteConfigResponse>> getAllConfigs() {
        try {
            return ApiResponse.success(siteConfigService.getAllConfigs());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/public/config/{configKey}")
    public ApiResponse<SiteConfigResponse> getByKey(@PathVariable String configKey) {
        try {
            return ApiResponse.success(siteConfigService.getByKey(configKey));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/config")
    public ApiResponse<SiteConfigResponse> createConfig(@RequestBody SiteConfigRequest request) {
        try {
            return ApiResponse.success("创建成功", siteConfigService.createConfig(request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/admin/config/{configKey}")
    public ApiResponse<SiteConfigResponse> updateConfig(@PathVariable String configKey,
                                                        @RequestBody SiteConfigRequest request) {
        try {
            return ApiResponse.success("更新成功", siteConfigService.updateConfig(configKey, request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/admin/config/{configKey}")
    public ApiResponse<Void> deleteConfig(@PathVariable String configKey) {
        try {
            siteConfigService.deleteConfig(configKey);
            return ApiResponse.success("删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
