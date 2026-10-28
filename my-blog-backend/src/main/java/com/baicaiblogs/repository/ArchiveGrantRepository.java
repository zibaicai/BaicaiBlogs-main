package com.baicaiblogs.repository;

import com.baicaiblogs.entity.ArchiveGrant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ArchiveGrantRepository extends JpaRepository<ArchiveGrant, Long> {
    Optional<ArchiveGrant> findByArchiveIdAndAdminUserIdAndRevokedAtIsNull(Long archiveId, Long adminUserId);
    List<ArchiveGrant> findByAdminUserIdAndRevokedAtIsNull(Long adminUserId);
    List<ArchiveGrant> findByArchiveIdAndRevokedAtIsNull(Long archiveId);
    void deleteByArchiveId(Long archiveId);
}
