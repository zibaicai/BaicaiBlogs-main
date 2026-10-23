package com.baicaiblogs.repository;

import com.baicaiblogs.entity.AlbumAccessRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AlbumAccessRequestRepository extends JpaRepository<AlbumAccessRequest, Long> {
    Optional<AlbumAccessRequest> findFirstByAdminIdAndAlbumIdAndStatusOrderByCreatedAtDesc(Long adminId, Long albumId, String status);
    long countByAdminIdAndCreatedAtAfter(Long adminId, LocalDateTime after);
    long countByAdminIdAndAlbumIdAndCreatedAtAfter(Long adminId, Long albumId, LocalDateTime after);
    List<AlbumAccessRequest> findAllByOrderByCreatedAtDesc();
    List<AlbumAccessRequest> findByAdminIdOrderByCreatedAtDesc(Long adminId);
}
