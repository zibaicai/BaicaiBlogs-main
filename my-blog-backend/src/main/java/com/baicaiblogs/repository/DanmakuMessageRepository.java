package com.baicaiblogs.repository;

import com.baicaiblogs.entity.DanmakuMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DanmakuMessageRepository extends JpaRepository<DanmakuMessage, Long> {
    Optional<DanmakuMessage> findFirstByOrderByCreatedAtAscIdAsc();
    List<DanmakuMessage> findAllByOrderByCreatedAtDesc();
    long countByUserIdAndCreatedAtAfter(Long userId, LocalDateTime after);
}
