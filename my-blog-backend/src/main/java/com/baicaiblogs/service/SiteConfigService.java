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
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ============ 分组配置方法 ============

    @Transactional(readOnly = true)
    public Map<String, Object> getSiteInfo() {
        return getConfigAsMap("site_info");
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

        config.setConfigValue(request.getConfigValue());
        config.setDescription(request.getDescription());

        return toResponse(siteConfigRepository.save(config));
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
