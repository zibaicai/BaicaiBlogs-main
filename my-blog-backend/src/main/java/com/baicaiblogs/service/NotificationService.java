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
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository repository;
    private final AlbumRepository albumRepository;

    /** ADMIN 首次通过 grant 查看密码相册时通知 owner；每内容版本一次，1 小时冷却。 */
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
                .title("密码相册被管理员查看")
                .body("管理员 #" + admin.getId() + " 因合规检查查看了你的密码相册《" + album.getTitle() + "》。")
                .targetType("album")
                .targetId(album.getId())
                .read(false)
                .build());
        album.setOwnerNotifiedVersion(version);
        albumRepository.save(album);
    }

    public List<Notification> list(User user) {
        return repository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    public long unread(User user) {
        return repository.countByUserIdAndReadFalse(user.getId());
    }

    @Transactional
    public void markRead(User user, Long id) {
        repository.findById(id).ifPresent(n -> {
            if (n.getUserId().equals(user.getId())) {
                n.setRead(true);
                repository.save(n);
            }
        });
    }
}
