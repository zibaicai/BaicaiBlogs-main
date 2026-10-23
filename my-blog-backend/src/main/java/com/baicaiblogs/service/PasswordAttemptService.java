package com.baicaiblogs.service;

import com.baicaiblogs.entity.AlbumUnlockAttempt;
import com.baicaiblogs.repository.AlbumUnlockAttemptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PasswordAttemptService {

    public static final int USER_LIMIT = 3;
    public static final int IP_LIMIT = 5;
    public static final int LOCK_MINUTES = 10;

    private final AlbumUnlockAttemptRepository repository;

    public void assertAllowed(Long albumId, Long userId, String ipHash) {
        LocalDateTime now = LocalDateTime.now();
        assertOne(albumId, "USER", String.valueOf(userId), now);
        if (ipHash != null) assertOne(albumId, "IP", ipHash, now);
    }

    private void assertOne(Long albumId, String scope, String subject, LocalDateTime now) {
        repository.findByAlbumIdAndScopeAndSubject(albumId, scope, subject).ifPresent(row -> {
            if (row.getLockedUntil() != null && row.getLockedUntil().isAfter(now)) {
                long seconds = java.time.Duration.between(now, row.getLockedUntil()).getSeconds();
                throw new RuntimeException("尝试次数过多，请 " + Math.max(1, (seconds + 59) / 60) + " 分钟后再试");
            }
        });
    }

    @Transactional
    public void fail(Long albumId, Long userId, String ipHash) {
        LocalDateTime now = LocalDateTime.now();
        bump(albumId, "USER", String.valueOf(userId), USER_LIMIT, now);
        if (ipHash != null) bump(albumId, "IP", ipHash, IP_LIMIT, now);
    }

    private void bump(Long albumId, String scope, String subject, int limit, LocalDateTime now) {
        AlbumUnlockAttempt row = repository.findByAlbumIdAndScopeAndSubject(albumId, scope, subject)
                .orElseGet(() -> AlbumUnlockAttempt.builder()
                        .albumId(albumId).scope(scope).subject(subject).failCount(0).build());
        if (row.getLockedUntil() != null && row.getLockedUntil().isBefore(now)) {
            row.setFailCount(0);
            row.setLockedUntil(null);
        }
        row.setFailCount((row.getFailCount() == null ? 0 : row.getFailCount()) + 1);
        if (row.getFailCount() >= limit) {
            row.setLockedUntil(now.plusMinutes(LOCK_MINUTES));
        }
        repository.save(row);
    }

    @Transactional
    public void clear(Long albumId, Long userId, String ipHash) {
        repository.deleteByAlbumIdAndScopeAndSubject(albumId, "USER", String.valueOf(userId));
        if (ipHash != null) repository.deleteByAlbumIdAndScopeAndSubject(albumId, "IP", ipHash);
    }
}
