package com.baicaiblogs.repository;

import com.baicaiblogs.entity.MusicPlaylist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MusicPlaylistRepository extends JpaRepository<MusicPlaylist, Long> {
    Optional<MusicPlaylist> findBySlug(String slug);
    List<MusicPlaylist> findByTypeAndStatusAndVisibilityOrderByHeatScoreDescCreatedAtDesc(
            String type, String status, String visibility);
    List<MusicPlaylist> findByOwnerIdAndTypeOrderByCreatedAtDesc(Long ownerId, String type);
    List<MusicPlaylist> findByStatusOrderByCreatedAtAsc(String status);
    boolean existsByPlatformAndExternalPlaylistIdAndType(String platform, String externalPlaylistId, String type);
    Optional<MusicPlaylist> findByPlatformAndExternalPlaylistIdAndType(String platform, String externalPlaylistId, String type);
}
