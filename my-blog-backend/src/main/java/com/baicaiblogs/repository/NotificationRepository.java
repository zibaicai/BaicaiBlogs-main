package com.baicaiblogs.repository;

import com.baicaiblogs.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserIdAndReadFalse(Long userId);
    boolean existsByUserIdAndTypeAndTargetIdAndCreatedAtAfter(Long userId, String type, Long targetId, LocalDateTime after);
}
