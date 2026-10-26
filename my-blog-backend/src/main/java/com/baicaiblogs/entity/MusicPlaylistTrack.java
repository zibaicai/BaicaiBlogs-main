package com.baicaiblogs.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "music_playlist_tracks", uniqueConstraints = @UniqueConstraint(name = "uk_music_playlist_track", columnNames = {"playlist_id", "track_id"}), indexes = {
        @Index(name = "idx_music_playlist_track_playlist", columnList = "playlist_id,position"),
        @Index(name = "idx_music_playlist_track_track", columnList = "track_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MusicPlaylistTrack {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "playlist_id", nullable = false)
    private Long playlistId;

    @Column(name = "track_id", nullable = false)
    private Long trackId;

    @Column(name = "position")
    @Builder.Default
    private Integer position = 0;
}
