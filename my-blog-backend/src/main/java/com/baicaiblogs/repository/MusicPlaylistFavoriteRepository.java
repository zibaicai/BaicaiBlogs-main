package com.baicaiblogs.repository;

import com.baicaiblogs.entity.MusicPlaylistFavorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MusicPlaylistFavoriteRepository extends JpaRepository<MusicPlaylistFavorite, Long> {
    Optional<MusicPlaylistFavorite> findByPlaylistIdAndUserId(Long playlistId, Long userId);
    long countByPlaylistId(Long playlistId);
}
