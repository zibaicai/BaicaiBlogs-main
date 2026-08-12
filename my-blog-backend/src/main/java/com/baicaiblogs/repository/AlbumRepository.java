package com.baicaiblogs.repository;

import com.baicaiblogs.entity.Album;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlbumRepository extends JpaRepository<Album, Long> {
    Optional<Album> findByAlbumId(String albumId);
    void deleteByAlbumId(String albumId);
    boolean existsByAlbumId(String albumId);
    List<Album> findAllByOrderBySortOrderAsc();
}
