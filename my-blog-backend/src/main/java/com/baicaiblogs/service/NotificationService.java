package com.baicaiblogs.service;

import com.baicaiblogs.entity.Album;
import com.baicaiblogs.entity.Notification;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.repository.AlbumRepository;
import com.baicaiblogs.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
        notifyUser(userId, type, title, body, targetType, targetId, link, null, null, null);
    }

    @Transactional
    public void notifyUser(Long userId, String type, String title, String body,
                           String targetType, Long targetId, String link,
                           Long actorId, String actorName, String actorAvatar) {
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
                .actorId(actorId)
                .actorName(actorName)
                .actorAvatar(actorAvatar)
                .read(false)
                .build());
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void backfillCategories() {
        repository.backfillCategories();
    }

    @Transactional(readOnly = true)
    public Page<Notification> page(User user, String category, int page, int size) {
        String requested = category == null || category.isBlank() ? "all" : category;
        PageRequest request = PageRequest.of(Math.max(0, page - 1), Math.min(50, Math.max(1, size)));
        return "all".equals(requested)
                ? repository.findByUserIdOrderByCreatedAtDesc(user.getId(), request)
                : repository.findByUserIdAndCategoryOrderByCreatedAtDesc(user.getId(), requested, request);
    }

    @Transactional(readOnly = true)
    public List<Notification> list(User user, String category, int page, int size) {
        return page(user, category, page, size).getContent();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> summary(User user) {
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("all", repository.countByUserIdAndReadFalse(user.getId()));
        for (String key : List.of("reply", "mention", "like", "system", "moderation")) {
            counts.put(key, repository.countByUserIdAndCategoryAndReadFalse(user.getId(), key));
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
    public void delete(User user, Long id) {
        repository.findById(id).ifPresent(notification -> {
            if (notification.getUserId().equals(user.getId())) repository.delete(notification);
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
