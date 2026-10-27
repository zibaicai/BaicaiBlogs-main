package com.baicaiblogs.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "music_playlist_issues", uniqueConstraints = @UniqueConstraint(
        name = "uk_music_playlist_issue", columnNames = {"playlist_id", "track_id"}), indexes = {
        @Index(name = "idx_music_issue_playlist", columnList = "playlist_id,first_seen_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MusicPlaylistIssue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "playlist_id", nullable = false)
    private Long playlistId;

    @Column(name = "track_id")
    private Long trackId;

    @Column(name = "title_snapshot", length = 300)
    private String titleSnapshot;

    @Column(name = "artist_snapshot", length = 300)
    private String artistSnapshot;

    /** REMOVED / VIP_ONLY / REGION_BLOCKED */
    @Column(name = "issue_type", nullable = false, length = 30)
    private String issueType;

    @Column(name = "first_seen_at", nullable = false)
    private LocalDateTime firstSeenAt;

    @Column(name = "last_checked_at")
    private LocalDateTime lastCheckedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
