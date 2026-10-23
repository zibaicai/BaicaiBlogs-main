package com.baicaiblogs.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "reports", indexes = {
        @Index(name = "idx_report_target", columnList = "target_type,target_id"),
        @Index(name = "idx_report_status", columnList = "status")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reporter_id", nullable = false)
    private Long reporterId;

    /** photo / album / comment / user */
    @Column(name = "target_type", length = 20)
    private String targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    /** 被举报资源的所有者，便于管理员封禁上传者 */
    @Column(name = "target_user_id")
    private Long targetUserId;

    @Column(length = 50)
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String detail;

    /** PENDING / HIDDEN / RESTORED / REJECTED */
    @Column(length = 20)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "evidence_key", length = 500)
    private String evidenceKey;

    @Column(name = "reporter_ip", length = 100)
    private String reporterIp;

    @Column(name = "handled_by")
    private Long handledBy;

    @Column(name = "handled_at")
    private LocalDateTime handledAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
