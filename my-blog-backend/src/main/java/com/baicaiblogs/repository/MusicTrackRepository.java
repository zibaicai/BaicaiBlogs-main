package com.baicaiblogs.repository;

import com.baicaiblogs.entity.MusicTrack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MusicTrackRepository extends JpaRepository<MusicTrack, Long> {
    Optional<MusicTrack> findByPlatformAndExternalTrackId(String platform, String externalTrackId);
    List<MusicTrack> findByStatus(String status);
}
