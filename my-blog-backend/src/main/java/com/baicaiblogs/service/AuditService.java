package com.baicaiblogs.service;

import com.baicaiblogs.entity.Album;
import com.baicaiblogs.entity.AlbumAccessLog;
import com.baicaiblogs.entity.OwnerVisibleAccessLog;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.repository.AlbumAccessLogRepository;
import com.baicaiblogs.repository.OwnerVisibleAccessLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AlbumAccessLogRepository internalRepository;
    private final OwnerVisibleAccessLogRepository ownerRepository;

    public void internal(User actor, Album album, String action, String accessType, Long grantId, String reason, String ip) {
        if (actor == null) return;
        internalRepository.save(AlbumAccessLog.builder()
                .actorId(actor.getId())
                .actorRole(actor.getRole())
                .albumId(album.getId())
                .action(action)
                .accessType(accessType)
                .grantId(grantId)
                .reason(reason)
                .ip(ip)
                .build());
    }

    /** 只有 ADMIN 通过 grant 的成功查看进入 owner 可见审计；超管永不写入。 */
    public void ownerVisible(Album album, User admin, String action, Long grantId) {
        if (album.getUserId() == null || admin == null) return;
        if (!"ADMIN".equals(admin.getRole())) return;
        ownerRepository.save(OwnerVisibleAccessLog.builder()
                .albumId(album.getId())
                .ownerId(album.getUserId())
                .adminId(admin.getId())
                .adminLabel("管理员 #" + admin.getId())
                .action(action)
                .grantId(grantId)
                .build());
    }

    public List<OwnerVisibleAccessLog> ownerLogs(Long albumId, Long ownerId) {
        return ownerRepository.findByAlbumIdAndOwnerIdOrderByViewedAtDesc(albumId, ownerId);
    }

    public List<AlbumAccessLog> allInternal() {
        return internalRepository.findAllByOrderByCreatedAtDesc();
    }
}
