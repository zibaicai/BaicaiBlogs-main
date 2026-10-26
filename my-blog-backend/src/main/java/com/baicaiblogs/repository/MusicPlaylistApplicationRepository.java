package com.baicaiblogs.repository;

import com.baicaiblogs.entity.MusicPlaylistApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MusicPlaylistApplicationRepository extends JpaRepository<MusicPlaylistApplication, Long> {
    List<MusicPlaylistApplication> findAllByOrderByCreatedAtDesc();
    List<MusicPlaylistApplication> findByApplicantIdOrderByCreatedAtDesc(Long applicantId);
    boolean existsByApplicantIdAndExternalPlaylistIdAndStatus(Long applicantId, String externalPlaylistId, String status);
}
