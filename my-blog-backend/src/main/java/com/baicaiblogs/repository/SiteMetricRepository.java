package com.baicaiblogs.repository;

import com.baicaiblogs.entity.SiteMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface SiteMetricRepository extends JpaRepository<SiteMetric, String> {

    @Modifying
    @Query("update SiteMetric m set m.metricValue = m.metricValue + 1, m.updatedAt = :now where m.metricKey = :key")
    int increment(@Param("key") String key, @Param("now") LocalDateTime now);
}
