package com.baicaiblogs.service;

import com.baicaiblogs.dto.*;
import com.baicaiblogs.entity.SiteConfig;
import com.baicaiblogs.repository.SiteConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SiteConfigService {

    private final SiteConfigRepository siteConfigRepository;

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
