package com.baicaiblogs.repository;

import com.baicaiblogs.entity.AlbumUnlockAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AlbumUnlockAttemptRepository extends JpaRepository<AlbumUnlockAttempt, Long> {
    Optional<AlbumUnlockAttempt> findByAlbumIdAndScopeAndSubject(Long albumId, String scope, String subject);
    void deleteByAlbumIdAndScopeAndSubject(Long albumId, String scope, String subject);
}
