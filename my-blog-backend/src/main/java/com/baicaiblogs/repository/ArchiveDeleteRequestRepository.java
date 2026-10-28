package com.baicaiblogs.repository;

import com.baicaiblogs.entity.ArchiveDeleteRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ArchiveDeleteRequestRepository extends JpaRepository<ArchiveDeleteRequest, Long> {
    List<ArchiveDeleteRequest> findByStatusOrderByCreatedAtDesc(String status);
    Optional<ArchiveDeleteRequest> findByArchiveIdAndRequestedByAndStatus(Long archiveId, Long requestedBy, String status);
    void deleteByArchiveId(Long archiveId);
}
