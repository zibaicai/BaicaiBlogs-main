package com.baicaiblogs.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "friend_applications", indexes = {
        @Index(name = "idx_friend_app_status", columnList = "status,created_at"),
        @Index(name = "idx_friend_app_ip", columnList = "ip_hash,created_at"),
        @Index(name = "idx_friend_app_claim", columnList = "claim_token_hash")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(length = 500)
    private String avatar;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 500)
    private String contact;

    @Column(name = "has_backlink")
    @Builder.Default
    private Boolean hasBacklink = false;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "ip_hash", length = 64)
    private String ipHash;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "claim_token_hash", length = 64)
    private String claimTokenHash;

    @Column(name = "bound_user_id")
    private Long boundUserId;

    @Column(name = "friend_id", length = 100)
    private String friendId;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "review_note", length = 1000)
    private String reviewNote;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
