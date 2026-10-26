package com.baicaiblogs.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Best-effort cleanup for managed OSS media.
 *
 * A file is deleted only when it is no longer referenced by any managed
 * surface. The reference check is intentionally conservative: an image that
 * still appears in a post body, a moment, an album, a config or a user avatar
 * is kept. External URLs are ignored by {@link OssService#deleteManagedImage}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MediaCleanupService {

    private final OssService ossService;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public void cleanupRemoved(String oldValue, String newValue) {
        if (oldValue == null || oldValue.equals(newValue)) return;
        try {
            Set<String> oldUrls = collectImageUrls(oldValue);
            oldUrls.removeAll(collectImageUrls(newValue));
            cleanupUnreferenced(oldUrls);
        } catch (Exception error) {
            log.warn("Media cleanup skipped: {}", error.getMessage());
        }
    }

    public void cleanupReplaced(String oldUrl, String newUrl) {
        if (oldUrl == null || oldUrl.equals(newUrl)) return;
        cleanupUnreferenced(Set.of(oldUrl));
    }

    public void cleanupUnreferenced(Collection<String> urls) {
        for (String url : new LinkedHashSet<>(urls)) {
            if (url == null || url.isBlank()) continue;
            try {
                if (isReferenced(url)) continue;
                ossService.deleteManagedImage(url);
            } catch (Exception error) {
                log.warn("Media cleanup failed for {}: {}", url, error.getMessage());
            }
        }
    }

    private boolean isReferenced(String url) {
        String like = "%" + url + "%";
        return count("SELECT COUNT(*) FROM site_config WHERE config_value LIKE ?", like) > 0
                || count("SELECT COUNT(*) FROM posts WHERE cover = ? OR file_url = ? OR content LIKE ? OR html_content LIKE ?", url, url, like, like) > 0
                || count("SELECT COUNT(*) FROM users WHERE avatar = ?", url) > 0
                || count("SELECT COUNT(*) FROM moments WHERE images LIKE ? OR content LIKE ? OR html_content LIKE ?", like, like, like) > 0
                || count("SELECT COUNT(*) FROM albums WHERE cover = ?", url) > 0
                || count("SELECT COUNT(*) FROM photos WHERE url = ?", url) > 0;
    }

    private long count(String sql, Object... args) {
        Long result = jdbcTemplate.queryForObject(sql, Long.class, args);
        return result == null ? 0L : result;
    }

    private Set<String> collectImageUrls(String json) {
        Set<String> result = new LinkedHashSet<>();
        try {
            JsonNode root = objectMapper.readTree(json);
            collect(root, result);
        } catch (Exception ignored) {
            // not JSON: no cleanup
        }
        return result;
    }

    private void collect(JsonNode node, Set<String> result) {
        if (node == null) return;
        if (node.isTextual()) {
            String value = node.asText();
            if (value.startsWith("/api/public/") || value.startsWith("http://") || value.startsWith("https://")) {
                result.add(value);
            }
            return;
        }
        if (node.isArray()) {
            node.forEach(child -> collect(child, result));
        } else if (node.isObject()) {
            node.fields().forEachRemaining(entry -> collect(entry.getValue(), result));
        }
    }
}
