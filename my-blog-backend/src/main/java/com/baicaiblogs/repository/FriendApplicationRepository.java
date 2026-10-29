package com.baicaiblogs.repository;

import com.baicaiblogs.entity.FriendApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface FriendApplicationRepository extends JpaRepository<FriendApplication, Long> {
    List<FriendApplication> findByStatusOrderByCreatedAtDesc(String status);
    List<FriendApplication> findAllByOrderByCreatedAtDesc();
    Optional<FriendApplication> findFirstByClaimTokenHashAndBoundUserIdIsNull(String claimTokenHash);
    Optional<FriendApplication> findFirstByBoundUserIdOrderByCreatedAtDesc(Long boundUserId);
    boolean existsByUrlAndStatusIn(String url, Collection<String> statuses);
    boolean existsByIpHashAndStatus(String ipHash, String status);
    long countByIpHashAndCreatedAtAfter(String ipHash, LocalDateTime after);
}
