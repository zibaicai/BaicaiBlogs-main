package com.baicaiblogs.repository;

import com.baicaiblogs.entity.Photo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PhotoRepository extends JpaRepository<Photo, Long> {
    List<Photo> findByAlbumIdOrderByWeightDescSortOrderAscIdAsc(Long albumId);
    long countByAlbumId(Long albumId);
    List<Photo> findByAlbumIdAndStatus(Long albumId, String status);

    @Query("select count(p) from Photo p where p.album.userId = :userId and p.createdAt between :start and :end")
    long countByUserAndCreatedAtBetween(@Param("userId") Long userId,
                                        @Param("start") LocalDateTime start,
                                        @Param("end") LocalDateTime end);
}
