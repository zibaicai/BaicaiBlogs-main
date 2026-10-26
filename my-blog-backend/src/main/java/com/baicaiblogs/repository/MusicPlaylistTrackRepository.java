package com.baicaiblogs.repository;

import com.baicaiblogs.entity.MusicPlaylistTrack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MusicPlaylistTrackRepository extends JpaRepository<MusicPlaylistTrack, Long> {
    List<MusicPlaylistTrack> findByPlaylistIdOrderByPositionAsc(Long playlistId);
    List<MusicPlaylistTrack> findByTrackId(Long trackId);
    long countByTrackId(Long trackId);
    void deleteByPlaylistId(Long playlistId);
}
