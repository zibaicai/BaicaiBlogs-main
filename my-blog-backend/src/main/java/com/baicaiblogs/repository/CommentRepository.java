package com.baicaiblogs.repository;

import com.baicaiblogs.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPostIdOrderByCreatedAtDesc(Long postId);
    List<Comment> findByChatterIdOrderByCreatedAtDesc(Long chatterId);
    List<Comment> findByMomentIdOrderByCreatedAtDesc(Long momentId);

    List<Comment> findByTargetTypeAndTargetIdAndStatusOrderByCreatedAtDesc(String targetType, Long targetId, String status);
    List<Comment> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(String targetType, Long targetId);
    List<Comment> findByTargetTypeAndTargetIdInOrderByCreatedAtDesc(String targetType, List<Long> targetIds);
    long countByTargetTypeAndTargetIdAndStatus(String targetType, Long targetId, String status);
    long countByTargetTypeAndTargetId(String targetType, Long targetId);

    List<Comment> findByTargetTypeAndExpiresAtBefore(String targetType, LocalDateTime now);
    List<Comment> findByTargetTypeAndExpiresAtBeforeAndStatus(String targetType, LocalDateTime now, String status);

    List<Comment> findByStatusOrderByCreatedAtDesc(String status);
}
