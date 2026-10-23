package com.baicaiblogs.repository;

import com.baicaiblogs.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    long countByTargetTypeAndTargetId(String targetType, Long targetId);
    List<Report> findByStatusOrderByCreatedAtDesc(String status);
    List<Report> findAllByOrderByCreatedAtDesc();
}
