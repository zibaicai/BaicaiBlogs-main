package com.baicaiblogs.controller;

import com.baicaiblogs.dto.*;
import com.baicaiblogs.service.SiteConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SiteConfigController {

    private final SiteConfigService siteConfigService;

    // ============ 分组配置公开端点 ============

    @GetMapping("/public/config/group/site-info")
    public ApiResponse<Map<String, Object>> getSiteInfo() {
        try {
            return ApiResponse.success(siteConfigService.getSiteInfo());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/public/config/group/background")
    public ApiResponse<Map<String, Object>> getBackgroundConfig() {
        try {
            return ApiResponse.success(siteConfigService.getBackgroundConfig());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/public/config/group/danmaku")
    public ApiResponse<List<String>> getDanmakuList() {
        try {
            return ApiResponse.success(siteConfigService.getDanmakuList());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/public/config/group/ai")
    public ApiResponse<Map<String, Object>> getAiConfig() {
        try {
            return ApiResponse.success(siteConfigService.getAiConfig());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/public/config/group/misc")
    public ApiResponse<Map<String, Object>> getMiscConfig() {
        try {
            return ApiResponse.success(siteConfigService.getMiscConfig());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

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
