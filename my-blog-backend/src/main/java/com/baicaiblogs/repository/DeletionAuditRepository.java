package com.baicaiblogs.repository;

import com.baicaiblogs.entity.DeletionAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeletionAuditRepository extends JpaRepository<DeletionAudit, Long> {
}
