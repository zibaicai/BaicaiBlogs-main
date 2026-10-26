package com.baicaiblogs.repository;

import com.baicaiblogs.entity.MusicPlaylistReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MusicPlaylistReactionRepository extends JpaRepository<MusicPlaylistReaction, Long> {
    Optional<MusicPlaylistReaction> findByPlaylistIdAndUserId(Long playlistId, Long userId);
    long countByPlaylistIdAndType(Long playlistId, String type);
}
