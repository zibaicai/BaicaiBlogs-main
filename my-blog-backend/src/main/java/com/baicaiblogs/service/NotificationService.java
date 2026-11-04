package com.baicaiblogs.service;

import com.baicaiblogs.entity.Album;
import com.baicaiblogs.entity.Notification;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.repository.AlbumRepository;
import com.baicaiblogs.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository repository;
    private final AlbumRepository albumRepository;

    @Transactional
    public void notifyAdminView(Album album, User admin, Long grantId) {
        if (album.getUserId() == null || admin == null || !"ADMIN".equals(admin.getRole())) return;
        long version = album.getContentVersion() == null ? 0 : album.getContentVersion();
        if (album.getOwnerNotifiedVersion() != null && album.getOwnerNotifiedVersion() == version) return;
        if (repository.existsByUserIdAndTypeAndTargetIdAndCreatedAtAfter(
                album.getUserId(), "ADMIN_ALBUM_VIEW", album.getId(), LocalDateTime.now().minusHours(1))) {
            return;
        }
        repository.save(Notification.builder()
                .userId(album.getUserId())
                .type("ADMIN_ALBUM_VIEW")
                .category("system")
                .title("密码相册被管理员查看")
                .body("管理员 #" + admin.getId() + " 因合规检查查看了你的密码相册《" + album.getTitle() + "》。")
                .targetType("album")
                .targetId(album.getId())
                .link("/photowall/" + album.getId())
                .read(false)
                .build());
        album.setOwnerNotifiedVersion(version);
        albumRepository.save(album);
    }

    @Transactional
    public void notifyUser(Long userId, String type, String title, String body) {
        notifyUser(userId, type, title, body, null, null, null);
    }

    @Transactional
    public void notifyUser(Long userId, String type, String title, String body,
                           String targetType, Long targetId, String link) {
        if (userId == null) return;
        repository.save(Notification.builder()
                .userId(userId)
                .type(type)
                .category(categoryOf(type))
                .title(title)
                .body(body)
                .targetType(targetType)
                .targetId(targetId)
                .link(link)
                .read(false)
                .build());
    }

    @Transactional(readOnly = true)
    public List<Notification> list(User user, String category, int page, int size) {
        String requested = category == null || category.isBlank() ? "all" : category;
        List<Notification> filtered = repository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .filter(notification -> "all".equals(requested) || requested.equals(categoryOf(notification)))
                .toList();
        int safePage = Math.max(0, page - 1);
        int safeSize = Math.min(50, Math.max(1, size));
        return filtered.stream().skip((long) safePage * safeSize).limit(safeSize).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> summary(User user) {
        List<Notification> items = repository.findByUserIdOrderByCreatedAtDesc(user.getId());
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("all", 0L);
        for (String key : List.of("reply", "mention", "like", "system", "moderation")) {
            counts.put(key, 0L);
        }
        for (Notification item : items) {
            if (Boolean.TRUE.equals(item.getRead())) continue;
            counts.put("all", counts.get("all") + 1);
            String category = categoryOf(item);
            counts.put(category, counts.getOrDefault(category, 0L) + 1);
        }
        return counts;
    }

    @Transactional(readOnly = true)
    public long unread(User user) {
        return repository.countByUserIdAndReadFalse(user.getId());
    }

    @Transactional
    public void markRead(User user, Long id) {
        repository.findById(id).ifPresent(notification -> {
            if (notification.getUserId().equals(user.getId())) {
                notification.setRead(true);
                notification.setReadAt(LocalDateTime.now());
                repository.save(notification);
            }
        });
    }

    @Transactional
    public void markAllRead(User user, String category) {
        String requested = category == null || category.isBlank() ? "all" : category;
        repository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .filter(notification -> !Boolean.TRUE.equals(notification.getRead()))
                .filter(notification -> "all".equals(requested) || requested.equals(categoryOf(notification)))
                .forEach(notification -> {
                    notification.setRead(true);
                    notification.setReadAt(LocalDateTime.now());
                    repository.save(notification);
                });
    }

    private String categoryOf(Notification notification) {
        if (notification.getCategory() != null && !notification.getCategory().isBlank()) {
            return notification.getCategory();
        }
        return categoryOf(notification.getType());
    }

    private String categoryOf(String type) {
        if (type == null) return "system";
        return switch (type) {
            case "COMMENT_REPLY" -> "reply";
            case "MENTION" -> "mention";
            case "COMMENT_LIKE", "POST_LIKE", "MOMENT_LIKE" -> "like";
            case "COMMENT_HIDDEN", "COMMENT_RESTORED", "COMMENT_APPEAL_REJECTED", "COMMENT_APPEAL_ACCEPTED" -> "moderation";
            default -> "system";
        };
    }
}
