package com.baicaiblogs.repository;

import com.baicaiblogs.entity.MusicPlaylistIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MusicPlaylistIssueRepository extends JpaRepository<MusicPlaylistIssue, Long> {
    List<MusicPlaylistIssue> findByPlaylistIdAndResolvedAtIsNullOrderByFirstSeenAtDesc(Long playlistId);
    List<MusicPlaylistIssue> findByPlaylistIdOrderByFirstSeenAtDesc(Long playlistId);
    Optional<MusicPlaylistIssue> findByPlaylistIdAndTrackIdAndResolvedAtIsNull(Long playlistId, Long trackId);
}
