package com.baicaiblogs.controller;

import com.baicaiblogs.dto.*;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.repository.UserRepository;
import com.baicaiblogs.service.SensitiveAccessService;
import com.baicaiblogs.service.SiteConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SiteConfigController {

    private final SiteConfigService siteConfigService;
    private final SensitiveAccessService sensitiveAccessService;
    private final UserRepository userRepository;

    // ============ 分组配置公开端点 ============

    @GetMapping("/public/config/group/site-info")
    public ApiResponse<Map<String, Object>> getSiteInfo() {
        try {
            return ApiResponse.success(siteConfigService.getPublicSiteInfo());
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
            return ApiResponse.success(siteConfigService.getPublicMiscConfig());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/public/config")
    public ApiResponse<List<SiteConfigResponse>> getAllConfigs() {
        try {
            return ApiResponse.success(siteConfigService.getPublicConfigs());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/public/config/{configKey}")
    public ApiResponse<SiteConfigResponse> getByKey(@PathVariable String configKey) {
        try {
            return ApiResponse.success(siteConfigService.getPublicByKey(configKey));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    // ============ 管理端配置读取 ============

    @GetMapping("/admin/config")
    public ApiResponse<List<SiteConfigResponse>> getAdminConfigs(Authentication authentication) {
        try {
            return ApiResponse.success(siteConfigService.getAdminConfigs(isSuperAdmin(authentication), canViewSensitive(authentication)));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/admin/config/group/{group}")
    public ApiResponse<Map<String, Object>> getAdminConfigGroup(@PathVariable String group,
                                                                Authentication authentication) {
        try {
            boolean superAdmin = canViewSensitive(authentication);
            Map<String, Object> value = switch (group) {
                case "site-info" -> siteConfigService.getAdminSiteInfo(superAdmin);
                case "background" -> siteConfigService.getBackgroundConfig();
                case "danmaku" -> Map.of("items", siteConfigService.getDanmakuList());
                case "ai" -> siteConfigService.getAiConfig();
                case "misc" -> siteConfigService.getAdminMiscConfig(isSuperAdmin(authentication));
                default -> throw new RuntimeException("未知配置组: " + group);
            };
            return ApiResponse.success(value);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/admin/config/{configKey}")
    public ApiResponse<SiteConfigResponse> getAdminByKey(@PathVariable String configKey,
                                                          Authentication authentication) {
        try {
            return ApiResponse.success(siteConfigService.getAdminByKey(configKey, isSuperAdmin(authentication), canViewSensitive(authentication)));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    private boolean isSuperAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_SUPER_ADMIN".equals(authority.getAuthority()));
    }

    private boolean canViewSensitive(Authentication authentication) {
        if (isSuperAdmin(authentication)) return true;
        if (authentication == null) return false;
        Object principal = authentication.getPrincipal();
        User user = principal instanceof User value
                ? value
                : userRepository.findByUsername(authentication.getName()).orElse(null);
        return sensitiveAccessService.hasActiveGrant(user, "site_social");
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
