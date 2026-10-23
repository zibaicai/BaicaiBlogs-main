package com.baicaiblogs.repository;

import com.baicaiblogs.entity.OwnerVisibleAccessLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OwnerVisibleAccessLogRepository extends JpaRepository<OwnerVisibleAccessLog, Long> {
    List<OwnerVisibleAccessLog> findByAlbumIdAndOwnerIdOrderByViewedAtDesc(Long albumId, Long ownerId);
}
