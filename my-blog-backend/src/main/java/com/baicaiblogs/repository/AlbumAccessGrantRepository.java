package com.baicaiblogs.repository;

import com.baicaiblogs.entity.AlbumAccessGrant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AlbumAccessGrantRepository extends JpaRepository<AlbumAccessGrant, Long> {
    Optional<AlbumAccessGrant> findFirstByAdminIdAndAlbumIdAndStatusAndExpiresAtAfterOrderByExpiresAtDesc(
            Long adminId, Long albumId, String status, LocalDateTime now);
    List<AlbumAccessGrant> findByAlbumIdAndStatus(Long albumId, String status);
    List<AlbumAccessGrant> findAllByOrderByCreatedAtDesc();
}
