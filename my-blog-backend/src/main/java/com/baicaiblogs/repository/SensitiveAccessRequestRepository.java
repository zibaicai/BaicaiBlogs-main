package com.baicaiblogs.repository;

import com.baicaiblogs.entity.SensitiveAccessRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SensitiveAccessRequestRepository extends JpaRepository<SensitiveAccessRequest, Long> {
    List<SensitiveAccessRequest> findAllByOrderByCreatedAtDesc();
    List<SensitiveAccessRequest> findByAdminIdOrderByCreatedAtDesc(Long adminId);
    List<SensitiveAccessRequest> findByAdminIdAndResourceTypeOrderByCreatedAtDesc(Long adminId, String resourceType);
    Optional<SensitiveAccessRequest> findFirstByAdminIdAndResourceTypeAndStatusAndExpiresAtAfterOrderByExpiresAtDesc(
            Long adminId, String resourceType, String status, LocalDateTime now);
    boolean existsByAdminIdAndResourceTypeAndStatus(Long adminId, String resourceType, String status);
}
