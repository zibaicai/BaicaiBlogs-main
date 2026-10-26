package com.baicaiblogs.repository;

import com.baicaiblogs.entity.CommentReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommentReactionRepository extends JpaRepository<CommentReaction, Long> {
    Optional<CommentReaction> findByCommentIdAndUserId(Long commentId, Long userId);
    long countByCommentIdAndType(Long commentId, String type);
    List<CommentReaction> findByCommentIdIn(List<Long> commentIds);
    void deleteByCommentId(Long commentId);
}
