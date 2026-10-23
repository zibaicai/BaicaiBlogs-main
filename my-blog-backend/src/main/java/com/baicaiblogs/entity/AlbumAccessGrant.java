package com.baicaiblogs.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "album_access_grants")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlbumAccessGrant {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_id")
    private Long requestId;

    @Column(name = "admin_id", nullable = false)
    private Long adminId;

    @Column(name = "album_id", nullable = false)
    private Long albumId;

    @Column(columnDefinition = "TEXT")
    private String reason;

    /** ACTIVE / EXPIRED / REVOKED */
    @Column(length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @Column(name = "created_by")
    private Long createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
