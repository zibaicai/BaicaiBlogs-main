package com.baicaiblogs.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(length = 20)
    private String role = "USER";

    @Column(length = 50)
    private String nickname;

    @Column(length = 500)
    private String avatar;

    /** ACTIVE / BANNED */
    @Column(length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    /** 原图存储配额，默认 1GB */
    @Column(name = "quota_bytes")
    @Builder.Default
    private Long quotaBytes = 1073741824L;

    @Column(name = "storage_used")
    @Builder.Default
    private Long storageUsed = 0L;

    /** 统一流量配额，默认 3GB/自然月 */
    @Column(name = "traffic_quota_bytes")
    @Builder.Default
    private Long trafficQuotaBytes = 3221225472L;

    @Column(name = "traffic_used")
    @Builder.Default
    private Long trafficUsed = 0L;

    /** yyyy-MM，用于自然月重置 */
    @Column(name = "traffic_period", length = 7)
    private String trafficPeriod;

    /** 封禁/改密后递增，用于让旧 JWT 立即失效 */
    @Column(name = "token_version")
    @Builder.Default
    private Integer tokenVersion = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
