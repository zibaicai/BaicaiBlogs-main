package com.baicaiblogs.repository;

import com.baicaiblogs.entity.ArchiveAccessLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ArchiveAccessLogRepository extends JpaRepository<ArchiveAccessLog, Long> {
    List<ArchiveAccessLog> findTop100ByArchiveIdOrderByCreatedAtDesc(Long archiveId);
    void deleteByArchiveId(Long archiveId);
}
