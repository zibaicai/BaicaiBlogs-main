package com.baicaiblogs.repository;

import com.baicaiblogs.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<Notification> findByUserIdAndCategoryOrderByCreatedAtDesc(Long userId, String category, Pageable pageable);
    long countByUserIdAndReadFalse(Long userId);
    long countByUserIdAndCategoryAndReadFalse(Long userId, String category);
    boolean existsByUserIdAndTypeAndTargetIdAndCreatedAtAfter(Long userId, String type, Long targetId, LocalDateTime after);
    boolean existsByUserIdAndTypeAndTargetIdAndActorId(Long userId, String type, Long targetId, Long actorId);

    @Modifying
    @Query(value = """
            UPDATE notifications SET category = CASE
              WHEN type = 'COMMENT_REPLY' THEN 'reply'
              WHEN type = 'MENTION' THEN 'mention'
              WHEN type LIKE '%\\_LIKE' THEN 'like'
              WHEN type IN ('COMMENT_HIDDEN','COMMENT_RESTORED','COMMENT_APPEAL_REJECTED','COMMENT_APPEAL_ACCEPTED') THEN 'moderation'
              ELSE 'system'
            END
            WHERE category IS NULL
            """, nativeQuery = true)
    int backfillCategories();
    long deleteByCreatedAtBefore(LocalDateTime before);
}
