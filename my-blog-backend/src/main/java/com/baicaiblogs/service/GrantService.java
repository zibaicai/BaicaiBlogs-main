package com.baicaiblogs.service;

import com.baicaiblogs.entity.Album;
import com.baicaiblogs.entity.AlbumAccessGrant;
import com.baicaiblogs.entity.AlbumAccessRequest;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.repository.AlbumAccessGrantRepository;
import com.baicaiblogs.repository.AlbumAccessRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GrantService {

    public static final int DAILY_REQUESTS = 3;
    private final AlbumAccessRequestRepository requestRepository;
    private final AlbumAccessGrantRepository grantRepository;

    @Transactional
    public AlbumAccessRequest request(User admin, Album album, String reason) {
        if (!"ADMIN".equals(admin.getRole())) throw new RuntimeException("只有 ADMIN 可以申请授权");
        if (!"PASSWORD".equalsIgnoreCase(album.getVisibility())) throw new RuntimeException("只有密码相册需要申请授权");
        if (reason == null || reason.trim().length() < 10) throw new RuntimeException("申请原因至少 10 个字");
        if (reason.length() > 500) throw new RuntimeException("申请原因不能超过 500 字");
        if (requestRepository.findFirstByAdminIdAndAlbumIdAndStatusOrderByCreatedAtDesc(
                admin.getId(), album.getId(), "PENDING").isPresent()) {
            throw new RuntimeException("该相册已有待审批申请");
        }
        LocalDateTime now = LocalDateTime.now();
        if (requestRepository.countByAdminIdAndCreatedAtAfter(admin.getId(), now.minusDays(1)) >= DAILY_REQUESTS) {
            throw new RuntimeException("每天最多申请 3 次");
        }
        requestRepository.findFirstByAdminIdAndAlbumIdAndStatusOrderByCreatedAtDesc(
                admin.getId(), album.getId(), "REJECTED").ifPresent(r -> {
            if (r.getReviewedAt() != null && r.getReviewedAt().isAfter(now.minusHours(24))) {
                throw new RuntimeException("被拒绝后 24 小时内不能再次申请");
            }
        });
        return requestRepository.save(AlbumAccessRequest.builder()
                .adminId(admin.getId())
                .albumId(album.getId())
                .reason(reason.trim())
                .status("PENDING")
                .build());
    }

    @Transactional
    public AlbumAccessGrant approve(User superAdmin, Long requestId) {
        if (!"SUPER_ADMIN".equals(superAdmin.getRole())) throw new RuntimeException("只有超级管理员可以审批");
        AlbumAccessRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("申请不存在"));
        if (!"PENDING".equals(request.getStatus())) throw new RuntimeException("申请已处理");
        request.setStatus("APPROVED");
        request.setReviewedBy(superAdmin.getId());
        request.setReviewedAt(LocalDateTime.now());
        requestRepository.save(request);
        return grantRepository.save(AlbumAccessGrant.builder()
                .requestId(request.getId())
                .adminId(request.getAdminId())
                .albumId(request.getAlbumId())
                .reason(request.getReason())
                .status("ACTIVE")
                .expiresAt(LocalDateTime.now().plusHours(1))
                .createdBy(superAdmin.getId())
                .build());
    }

    @Transactional
    public void reject(User superAdmin, Long requestId) {
        if (!"SUPER_ADMIN".equals(superAdmin.getRole())) throw new RuntimeException("只有超级管理员可以审批");
        AlbumAccessRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("申请不存在"));
        if (!"PENDING".equals(request.getStatus())) throw new RuntimeException("申请已处理");
        request.setStatus("REJECTED");
        request.setReviewedBy(superAdmin.getId());
        request.setReviewedAt(LocalDateTime.now());
        requestRepository.save(request);
    }

    public Optional<AlbumAccessGrant> activeGrant(Long adminId, Long albumId) {
        return grantRepository.findFirstByAdminIdAndAlbumIdAndStatusAndExpiresAtAfterOrderByExpiresAtDesc(
                adminId, albumId, "ACTIVE", LocalDateTime.now());
    }

    @Transactional
    public void revokeForAlbum(Long albumId) {
        for (AlbumAccessGrant grant : grantRepository.findByAlbumIdAndStatus(albumId, "ACTIVE")) {
            grant.setStatus("REVOKED");
            grant.setRevokedAt(LocalDateTime.now());
            grantRepository.save(grant);
        }
    }

    public List<AlbumAccessRequest> requests(User user) {
        return "SUPER_ADMIN".equals(user.getRole())
                ? requestRepository.findAllByOrderByCreatedAtDesc()
                : requestRepository.findByAdminIdOrderByCreatedAtDesc(user.getId());
    }

    public List<AlbumAccessGrant> grants(User user) {
        return "SUPER_ADMIN".equals(user.getRole())
                ? grantRepository.findAllByOrderByCreatedAtDesc()
                : grantRepository.findAll().stream().filter(g -> g.getAdminId().equals(user.getId())).toList();
    }
}
