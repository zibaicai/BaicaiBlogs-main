package com.baicaiblogs.repository;

import com.baicaiblogs.entity.UserPresence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface UserPresenceRepository extends JpaRepository<UserPresence, Long> {
    long countByLastSeenAtAfter(LocalDateTime cutoff);
}
