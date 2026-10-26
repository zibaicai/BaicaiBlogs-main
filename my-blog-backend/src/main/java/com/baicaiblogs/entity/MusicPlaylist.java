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
@Table(name = "music_playlists", indexes = {
        @Index(name = "idx_music_playlist_public", columnList = "type,status,heat"),
        @Index(name = "idx_music_playlist_owner", columnList = "owner_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MusicPlaylist {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 160)
    private String slug;

    @Column(nullable = false, length = 30)
    private String platform;

    @Column(name = "external_playlist_id", length = 120)
    private String externalPlaylistId;

    /** CURATED / PERSONAL */
    @Column(nullable = false, length = 20)
    private String type;

    /** PUBLIC / PRIVATE */
    @Column(nullable = false, length = 20)
    private String visibility;

    @Column(name = "owner_id")
    private Long ownerId;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(length = 500)
    private String cover;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "track_count")
    @Builder.Default
    private Integer trackCount = 0;

    /** ACTIVE / PENDING / DEMOTED / REJECTED / HIDDEN */
    @Column(length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "heat_score")
    @Builder.Default
    private Integer heatScore = 0;

    @Column(name = "recommender_name", length = 100)
    private String recommenderName;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
