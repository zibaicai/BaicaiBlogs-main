package com.baicaiblogs.repository;

import com.baicaiblogs.entity.PrivateMomentAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PrivateMomentAuditRepository extends JpaRepository<PrivateMomentAudit, Long> {
}
