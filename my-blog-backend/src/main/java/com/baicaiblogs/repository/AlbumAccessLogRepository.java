package com.baicaiblogs.repository;

import com.baicaiblogs.entity.AlbumAccessLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlbumAccessLogRepository extends JpaRepository<AlbumAccessLog, Long> {
    List<AlbumAccessLog> findAllByOrderByCreatedAtDesc();
}
