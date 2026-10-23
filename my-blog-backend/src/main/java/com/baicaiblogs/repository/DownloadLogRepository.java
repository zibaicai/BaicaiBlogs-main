package com.baicaiblogs.repository;

import com.baicaiblogs.entity.DownloadLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface DownloadLogRepository extends JpaRepository<DownloadLog, Long> {
    long countDistinctByUserIdAndCreatedAtBetween(Long userId, LocalDateTime start, LocalDateTime end);
    boolean existsByUserIdAndPhotoIdAndCreatedAtBetween(Long userId, Long photoId, LocalDateTime start, LocalDateTime end);
}
