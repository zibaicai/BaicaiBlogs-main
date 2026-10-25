package com.baicaiblogs.service;

import com.baicaiblogs.entity.Post;
import com.baicaiblogs.entity.SiteConfig;
import com.baicaiblogs.repository.PostRepository;
import com.baicaiblogs.repository.SiteConfigRepository;
import com.baicaiblogs.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Removes managed OSS images that are no longer referenced after a config update.
 * This covers single-value fields such as avatar/favicon and list fields such as bgImages.
 */
@Service
@RequiredArgsConstructor
public class MediaCleanupService {

    private final OssService ossService;
    private final SiteConfigRepository siteConfigRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public void cleanupRemoved(String oldValue, String newValue) {
        if (oldValue == null || oldValue.equals(newValue)) return;
        try {
            Set<String> oldUrls = collectImageUrls(oldValue);
            Set<String> newUrls = collectImageUrls(newValue);
            if (oldUrls.isEmpty()) return;

            oldUrls.removeAll(newUrls);
            if (oldUrls.isEmpty()) return;

            String currentConfigText = siteConfigRepository.findAll().stream()
                    .map(SiteConfig::getConfigValue)
                    .filter(value -> value != null)
                    .reduce("", (a, b) -> a + b);
            Set<String> postReferences = new HashSet<>();
            for (Post post : postRepository.findAll()) {
                if (post.getCover() != null) postReferences.add(post.getCover());
                if (post.getFileUrl() != null) postReferences.add(post.getFileUrl());
            }
            Set<String> userAvatars = new HashSet<>();
            userRepository.findAll().forEach(user -> {
                if (user.getAvatar() != null) userAvatars.add(user.getAvatar());
            });

            for (String url : oldUrls) {
                if (currentConfigText.contains(url) || postReferences.contains(url) || userAvatars.contains(url)) {
                    continue;
                }
                ossService.deleteManagedImage(url);
            }
        } catch (Exception ignored) {
            // Cleanup is best-effort; never block saving site configuration.
        }
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
