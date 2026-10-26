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
@Table(name = "comments", indexes = {
        @Index(name = "idx_comment_target", columnList = "target_type,target_id"),
        @Index(name = "idx_comment_expiry", columnList = "status,expires_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** POST / MOMENT / ALBUM / TRACK / CHATTER */
    @Column(name = "target_type", length = 20)
    private String targetType;

    @Column(name = "target_id")
    private Long targetId;

    /** Legacy target columns kept for migration compatibility. */
    @Column(name = "post_id")
    private Long postId;

    @Column(name = "chatter_id")
    private Long chatterId;

    @Column(name = "moment_id")
    private Long momentId;

    @Column(name = "user_id")
    private Long userId;

    @Column(length = 100)
    private String author;

    @Column(length = 200)
    private String email;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(length = 500)
    private String avatar;

    /** VISIBLE / HIDDEN / DELETED / EXPIRED */
    @Column(length = 20)
    @Builder.Default
    private String status = "VISIBLE";

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
