package com.baicaiblogs.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "suggestions", indexes = {
        @Index(name = "idx_suggestion_user", columnList = "user_id,created_at"),
        @Index(name = "idx_suggestion_status", columnList = "status,created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Suggestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(length = 60)
    private String category;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /** SUBMITTED / IN_REVIEW / NEEDS_INFO / ACCEPTED / REJECTED / PLANNED / IMPLEMENTED / REWARD_PENDING / REWARD_PAID / CLOSED */
    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "SUBMITTED";

    private Integer score;

    @Column(name = "reward_amount", precision = 5, scale = 2)
    private BigDecimal rewardAmount;

    @Column(name = "reward_status", length = 30)
    @Builder.Default
    private String rewardStatus = "NONE";

    @Column(name = "reviewer_id")
    private Long reviewerId;

    @Column(name = "review_note", columnDefinition = "TEXT")
    private String reviewNote;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
