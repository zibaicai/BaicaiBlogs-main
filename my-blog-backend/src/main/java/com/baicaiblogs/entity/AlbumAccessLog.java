package com.baicaiblogs.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "album_access_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlbumAccessLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_id", nullable = false)
    private Long actorId;

    @Column(name = "actor_role", length = 30)
    private String actorRole;

    @Column(name = "album_id", nullable = false)
    private Long albumId;

    @Column(length = 30)
    private String action;

    @Column(name = "access_type", length = 30)
    private String accessType;

    @Column(name = "grant_id")
    private Long grantId;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(length = 100)
    private String ip;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
