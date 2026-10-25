package com.baicaiblogs.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "site_metric")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiteMetric {

    @Id
    @Column(name = "metric_key", length = 50)
    private String metricKey;

    @Column(name = "metric_value", nullable = false)
    private Long metricValue;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
