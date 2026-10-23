package com.baicaiblogs.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "appeals", indexes = {
        @Index(name = "idx_appeal_target", columnList = "target_type,target_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Appeal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "target_type", length = 20)
    private String targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Column(columnDefinition = "TEXT")
    private String reason;

    /** PENDING / ACCEPTED / REJECTED / SUPER_REOPENED / FINAL_ACCEPTED / FINAL_REJECTED */
    @Column(length = 30)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "handled_by")
    private Long handledBy;

    @Column(name = "handled_at")
    private LocalDateTime handledAt;

    @Column(name = "super_locked")
    @Builder.Default
    private Boolean superLocked = false;

    @Column(name = "super_note", columnDefinition = "TEXT")
    private String superNote;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
