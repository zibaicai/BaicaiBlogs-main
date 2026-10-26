package com.baicaiblogs.service;

import com.baicaiblogs.dto.*;
import com.baicaiblogs.entity.SiteConfig;
import com.baicaiblogs.repository.SiteConfigRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SiteConfigService {

    private final SiteConfigRepository siteConfigRepository;
    private final MediaCleanupService mediaCleanupService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ============ 分组配置方法 ============

    @Transactional(readOnly = true)
    public Map<String, Object> getSiteInfo() {
        return getConfigAsMap("site_info");
    }

    /** Public view: never expose private contact fields. */
    @Transactional(readOnly = true)
    public Map<String, Object> getPublicSiteInfo() {
        Map<String, Object> info = new LinkedHashMap<>(getConfigAsMap("site_info"));
        Object rawSocial = info.get("social");
        Map<String, Object> publicSocial = new LinkedHashMap<>();
        if (rawSocial instanceof Map<?, ?> social) {
            for (String key : new String[]{"github", "gitee"}) {
                Object value = social.get(key);
                if (value != null) publicSocial.put(key, value);
            }
        }
        info.put("social", publicSocial);
        return info;
    }

    /** Admin view; ordinary admins receive masked private fields. */
    public Map<String, Object> getAdminSiteInfo(boolean superAdmin) {
        Map<String, Object> info = new LinkedHashMap<>(getConfigAsMap("site_info"));
        if (!superAdmin) {
            Object rawSocial = info.get("social");
            Map<String, Object> masked = new LinkedHashMap<>();
            if (rawSocial instanceof Map<?, ?> social) {
                for (String key : new String[]{"github", "gitee"}) {
                    Object value = social.get(key);
                    if (value != null) masked.put(key, value);
                }
                for (String key : new String[]{"email", "qq", "wechat", "google"}) {
                    if (social.get(key) != null) masked.put(key, "***");
                }
            }
            info.put("social", masked);
            info.put("__restricted", List.of("email", "qq", "wechat", "google"));
        }
        return info;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getBackgroundConfig() {
        return getConfigAsMap("background");
    }

    @Transactional(readOnly = true)
    public List<String> getDanmakuList() {
        return getConfigAsList("danmaku_list");
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAiConfig() {
        return getConfigAsMap("ai_config");
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMiscConfig() {
        return getConfigAsMap("misc");
    }

    /** Public view: remove tokens and private integration secrets. */
    @Transactional(readOnly = true)
    public Map<String, Object> getPublicMiscConfig() {
        Map<String, Object> misc = new LinkedHashMap<>(getConfigAsMap("misc"));
        misc.remove("picBedToken");
        Object gitalk = misc.get("gitalkConfig");
        if (gitalk instanceof Map<?, ?> source) {
            Map<String, Object> safe = new LinkedHashMap<>();
            for (String key : new String[]{"clientID", "repo", "owner", "admin"}) {
                if (source.get(key) != null) safe.put(key, source.get(key));
            }
            misc.put("gitalkConfig", safe);
        }
        return misc;
    }

    public Map<String, Object> getAdminMiscConfig(boolean superAdmin) {
        Map<String, Object> misc = new LinkedHashMap<>(getConfigAsMap("misc"));
        if (!superAdmin) {
            misc.remove("picBedToken");
            Object gitalk = misc.get("gitalkConfig");
            if (gitalk instanceof Map<?, ?> source) {
                Map<String, Object> safe = new LinkedHashMap<>();
                for (String key : new String[]{"clientID", "repo", "owner", "admin"}) {
                    if (source.get(key) != null) safe.put(key, source.get(key));
                }
                misc.put("gitalkConfig", safe);
            }
            misc.put("__restricted", List.of("picBedToken", "gitalkConfig.clientSecret"));
        }
        return misc;
    }

    private Map<String, Object> getConfigAsMap(String key) {
        return siteConfigRepository.findByConfigKey(key)
                .map(c -> {
                    try {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> result = objectMapper.readValue(c.getConfigValue(), Map.class);
                        return result;
                    } catch (Exception e) {
                        return new HashMap<String, Object>();
                    }
                })
                .orElse(new HashMap<>());
    }

    @SuppressWarnings("unchecked")
    private List<String> getConfigAsList(String key) {
        return siteConfigRepository.findByConfigKey(key)
                .map(c -> {
                    try {
                        return (List<String>) objectMapper.readValue(c.getConfigValue(), List.class);
                    } catch (Exception e) {
                        return new ArrayList<String>();
                    }
                })
                .orElse(new ArrayList<>());
    }

    @Transactional(readOnly = true)
    public List<SiteConfigResponse> getAllConfigs() {
        return siteConfigRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<SiteConfigResponse> getAdminConfigs(boolean superAdmin, boolean socialGrant) {
        Set<String> allowed = Set.of("site_info", "background", "danmaku_list", "misc", "ai_config");
        return siteConfigRepository.findAll().stream()
                .filter(config -> allowed.contains(config.getConfigKey()))
                .map(config -> sanitizeResponse(config, superAdmin, socialGrant))
                .collect(Collectors.toList());
    }

    public List<SiteConfigResponse> getPublicConfigs() {
        Set<String> allowed = Set.of("site_info", "background", "danmaku_list", "misc", "ai_config");
        return siteConfigRepository.findAll().stream()
                .filter(config -> allowed.contains(config.getConfigKey()))
                .map(this::sanitizeResponse)
                .collect(Collectors.toList());
    }

    public SiteConfigResponse getPublicByKey(String configKey) {
        Set<String> allowed = Set.of("site_info", "background", "danmaku_list", "misc", "ai_config");
        if (!allowed.contains(configKey)) {
            throw new RuntimeException("配置项不可公开: " + configKey);
        }
        SiteConfig config = siteConfigRepository.findByConfigKey(configKey)
                .orElseThrow(() -> new RuntimeException("配置项不存在: " + configKey));
        return sanitizeResponse(config);
    }

    public SiteConfigResponse getAdminByKey(String configKey, boolean superAdmin, boolean socialGrant) {
        SiteConfig config = siteConfigRepository.findByConfigKey(configKey)
                .orElseThrow(() -> new RuntimeException("配置项不存在: " + configKey));
        return sanitizeResponse(config, superAdmin, socialGrant);
    }

    private SiteConfigResponse sanitizeResponse(SiteConfig config) {
        return sanitizeResponse(config, false, false);
    }

    private SiteConfigResponse sanitizeResponse(SiteConfig config, boolean superAdmin) {
        return sanitizeResponse(config, superAdmin, superAdmin);
    }

    private SiteConfigResponse sanitizeResponse(SiteConfig config, boolean superAdmin, boolean socialGrant) {
        String key = config.getConfigKey();
        Object value = null;
        if ("site_info".equals(key)) {
            value = (superAdmin || socialGrant) ? getAdminSiteInfo(true) : getPublicSiteInfo();
        } else if ("misc".equals(key)) {
            value = superAdmin ? getAdminMiscConfig(true) : getPublicMiscConfig();
        } else {
            try {
                value = objectMapper.readValue(config.getConfigValue(), Object.class);
            } catch (Exception ignored) {
                value = null;
            }
        }
        String configValue;
        try {
            configValue = objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            configValue = config.getConfigValue();
        }
        return SiteConfigResponse.builder()
                .id(config.getId())
                .configKey(key)
                .configValue(configValue)
                .description(config.getDescription())
                .updatedAt(config.getUpdatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public SiteConfigResponse getByKey(String configKey) {
        SiteConfig config = siteConfigRepository.findByConfigKey(configKey)
                .orElseThrow(() -> new RuntimeException("配置项不存在: " + configKey));
        return toResponse(config);
    }

    @Transactional
    public SiteConfigResponse createConfig(SiteConfigRequest request) {
        if (siteConfigRepository.findByConfigKey(request.getConfigKey()).isPresent()) {
            throw new RuntimeException("配置键已存在: " + request.getConfigKey());
        }

        SiteConfig config = SiteConfig.builder()
                .configKey(request.getConfigKey())
                .configValue(request.getConfigValue())
                .description(request.getDescription())
                .build();

        return toResponse(siteConfigRepository.save(config));
    }

    @Transactional
    public SiteConfigResponse updateConfig(String configKey, SiteConfigRequest request) {
        SiteConfig config = siteConfigRepository.findByConfigKey(configKey)
                .orElseThrow(() -> new RuntimeException("配置项不存在: " + configKey));

        String oldValue = config.getConfigValue();
        config.setConfigValue(request.getConfigValue());
        config.setDescription(request.getDescription());

        SiteConfig saved = siteConfigRepository.saveAndFlush(config);
        mediaCleanupService.cleanupRemoved(oldValue, request.getConfigValue());
        return toResponse(saved);
    }

    @Transactional
    public void deleteConfig(String configKey) {
        if (siteConfigRepository.findByConfigKey(configKey).isEmpty()) {
            throw new RuntimeException("配置项不存在: " + configKey);
        }
        siteConfigRepository.deleteByConfigKey(configKey);
    }

    private SiteConfigResponse toResponse(SiteConfig config) {
        return SiteConfigResponse.builder()
                .id(config.getId())
                .configKey(config.getConfigKey())
                .configValue(config.getConfigValue())
                .description(config.getDescription())
                .updatedAt(config.getUpdatedAt())
                .build();
    }
}
