package com.baicaiblogs.repository;

import com.baicaiblogs.entity.RegistrationAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface RegistrationAuditRepository extends JpaRepository<RegistrationAudit, Long> {
    long countByIpHashAndCreatedAtAfter(String ipHash, LocalDateTime after);
}
