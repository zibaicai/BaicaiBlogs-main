package com.baicaiblogs.config;

import com.baicaiblogs.entity.DanmakuMessage;
import com.baicaiblogs.repository.DanmakuMessageRepository;
import com.baicaiblogs.repository.SiteConfigRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 首次上线时把旧 site_config 的 danmaku_list 导入弹幕表，
 * 之后 C 端只读写 danmaku_messages，不再使用硬编码配置。
 */
@Component
@RequiredArgsConstructor
public class DanmakuDataInitializer implements CommandLineRunner {

    private final DanmakuMessageRepository danmakuRepository;
    private final SiteConfigRepository siteConfigRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    @Transactional
    public void run(String... args) {
        if (danmakuRepository.count() > 0) return;
        siteConfigRepository.findByConfigKey("danmaku_list").ifPresent(config -> {
            try {
                List<String> list = objectMapper.readValue(config.getConfigValue(), new TypeReference<List<String>>() {});
                int inserted = 0;
                for (String text : list) {
                    if (text == null || text.isBlank() || inserted >= 500) continue;
                    String trimmed = text.trim();
                    if (trimmed.length() > 100) trimmed = trimmed.substring(0, 100);
                    danmakuRepository.save(DanmakuMessage.builder().text(trimmed).build());
                    inserted++;
                }
            } catch (Exception ignored) {
            }
        });
    }
}
