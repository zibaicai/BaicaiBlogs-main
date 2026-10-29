package com.baicaiblogs.repository;

import com.baicaiblogs.entity.FriendMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface FriendMessageRepository extends JpaRepository<FriendMessage, Long> {
    List<FriendMessage> findByStatusOrderByCreatedAtDesc(String status);
    List<FriendMessage> findAllByOrderByCreatedAtDesc();
    long countByIpHashAndCreatedAtAfter(String ipHash, LocalDateTime after);
    boolean existsByIpHashAndContentAndCreatedAtAfter(String ipHash, String content, LocalDateTime after);
}
