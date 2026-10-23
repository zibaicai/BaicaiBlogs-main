package com.baicaiblogs.service;

import com.baicaiblogs.entity.*;
import com.baicaiblogs.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class QuotaService {

    public static final long STORAGE_QUOTA = 1073741824L;      // 1GB
    public static final long TRAFFIC_QUOTA = 3221225472L;      // 3GB / 自然月
    public static final long LARGE_FILE_THRESHOLD = 800L * 1024L; // 800KiB
    public static final int DAILY_IMAGE_LIMIT = 10;
    public static final int DAILY_UPLOAD_LIMIT = 10;
    public static final int NEW_USER_DAYS = 7;

    private static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");

    private final UserRepository userRepository;
    private final DownloadLogRepository downloadLogRepository;
    private final TrafficLedgerRepository trafficLedgerRepository;

    public boolean isAdmin(User user) {
        return user != null && ("ADMIN".equals(user.getRole()) || "SUPER_ADMIN".equals(user.getRole()));
    }

    public boolean isSuperAdmin(User user) {
        return user != null && "SUPER_ADMIN".equals(user.getRole());
    }

    public boolean isNewUser(User user) {
        return user != null && user.getCreatedAt() != null
                && user.getCreatedAt().plusDays(NEW_USER_DAYS).isAfter(LocalDateTime.now());
    }

    public void assertUploadUnlocked(User user) {
        if (isAdmin(user)) return;
        if (isNewUser(user)) {
            throw new RuntimeException("注册满 7 天后才能上传/建相册");
        }
        if ("BANNED".equalsIgnoreCase(user.getStatus())) {
            throw new RuntimeException("账号已被封禁");
        }
    }

    public long storageQuota(User user) {
        return user.getQuotaBytes() == null ? STORAGE_QUOTA : user.getQuotaBytes();
    }

    public long storageUsed(User user) {
        return user.getStorageUsed() == null ? 0L : user.getStorageUsed();
    }

    public void assertStorage(User user, long addBytes) {
        if (isAdmin(user)) return;
        if (storageUsed(user) + addBytes > storageQuota(user)) {
            throw new RuntimeException("存储配额不足（1GB），请删除图片后再试");
        }
    }

    @Transactional
    public void addStorage(User user, long bytes) {
        user.setStorageUsed(Math.max(0L, storageUsed(user) + bytes));
        userRepository.save(user);
    }

    @Transactional
    public void releaseStorage(User user, long bytes) {
        user.setStorageUsed(Math.max(0L, storageUsed(user) - bytes));
        userRepository.save(user);
    }

    public long trafficQuota(User user) {
        return user.getTrafficQuotaBytes() == null ? TRAFFIC_QUOTA : user.getTrafficQuotaBytes();
    }

    private String currentPeriod() {
        return YearMonth.now(ZONE).toString();
    }

    @Transactional
    public User ensureTrafficPeriod(User user) {
        String period = currentPeriod();
        if (!period.equals(user.getTrafficPeriod())) {
            user.setTrafficPeriod(period);
            user.setTrafficUsed(0L);
            userRepository.save(user);
        }
        return user;
    }

    public long trafficUsed(User user) {
        return user.getTrafficUsed() == null ? 0L : user.getTrafficUsed();
    }

    public long remainingTraffic(User user) {
        return Math.max(0L, trafficQuota(user) - trafficUsed(user));
    }

    public long dailyDownloadCount(User user) {
        LocalDateTime start = LocalDate.now(ZONE).atStartOfDay();
        return downloadLogRepository.countDistinctByUserIdAndCreatedAtBetween(
                user.getId(), start, start.plusDays(1));
    }

    public boolean alreadyCountedPhotoToday(User user, Long photoId) {
        LocalDateTime start = LocalDate.now(ZONE).atStartOfDay();
        return downloadLogRepository.existsByUserIdAndPhotoIdAndCreatedAtBetween(
                user.getId(), photoId, start, start.plusDays(1));
    }

    /**
     * 查看/下载原图前的统一检查。自己的原图不占 10 张次数，但大文件仍计流量。
     * 同一张图当天只扣一次次数。
     */
    @Transactional
    public void authorizeOriginal(User user, Photo photo, boolean owner) {
        if (isAdmin(user)) return;
        if ("BANNED".equalsIgnoreCase(user.getStatus())) {
            throw new RuntimeException("账号已被封禁");
        }
        if (!owner && !alreadyCountedPhotoToday(user, photo.getId())
                && dailyDownloadCount(user) >= DAILY_IMAGE_LIMIT) {
            throw new RuntimeException("今日原图额度已用完（10 张），请明天再试");
        }
    }

    @Transactional
    public void recordOriginal(User user, Photo photo, String action, long bytes, String ipHash, boolean owner) {
        if (isAdmin(user)) return;
        boolean counted = alreadyCountedPhotoToday(user, photo.getId());
        if (!counted) {
            DownloadLog log = DownloadLog.builder()
                    .userId(user.getId())
                    .photoId(photo.getId())
                    .action(action)
                    .bytes(bytes)
                    .ipHash(ipHash)
                    .build();
            downloadLogRepository.save(log);
        }
        if (bytes > LARGE_FILE_THRESHOLD) {
            User fresh = ensureTrafficPeriod(user);
            long used = trafficUsed(fresh) + bytes;
            if (used > trafficQuota(fresh)) {
                throw new RuntimeException("本月流量额度已用完（3GB），请下月再试");
            }
            fresh.setTrafficUsed(used);
            userRepository.save(fresh);
            trafficLedgerRepository.save(TrafficLedger.builder()
                    .userId(user.getId())
                    .resourceType("photo_original")
                    .resourceId(photo.getId())
                    .bytes(bytes)
                    .action(action)
                    .build());
        }
    }

    public long remainingImagesToday(User user) {
        if (isAdmin(user)) return Long.MAX_VALUE;
        return Math.max(0, DAILY_IMAGE_LIMIT - dailyDownloadCount(user));
    }
}
