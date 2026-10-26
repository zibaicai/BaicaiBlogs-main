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
@Table(name = "music_tracks", uniqueConstraints = @UniqueConstraint(name = "uk_music_track_external", columnNames = {"platform", "external_track_id"}), indexes = {
        @Index(name = "idx_music_track_status", columnList = "status,purge_after")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MusicTrack {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String platform;

    @Column(name = "external_track_id", nullable = false, length = 120)
    private String externalTrackId;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(length = 300)
    private String artist;

    @Column(length = 500)
    private String cover;

    private Integer duration;

    /** ACTIVE / UNLISTED / HIDDEN */
    @Column(length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "external_url", length = 1000)
    private String externalUrl;

    @Column(name = "orphaned_at")
    private LocalDateTime orphanedAt;

    @Column(name = "purge_after")
    private LocalDateTime purgeAfter;

    @Column(name = "last_seen_at")
    private LocalDateTime lastSeenAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
