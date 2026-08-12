package com.baicaiblogs.repository;

import com.baicaiblogs.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    Optional<Post> findBySlug(String slug);
    List<Post> findByStatusOrderByDateDesc(String status);
    Page<Post> findByStatus(String status, Pageable pageable);
    void deleteBySlug(String slug);

    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' ORDER BY p.date DESC")
    List<Post> findAllPublished();

    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' ORDER BY p.date DESC")
    Page<Post> findAllPublished(Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' AND (p.title LIKE %:keyword% OR p.description LIKE %:keyword%)")
    List<Post> searchPublished(String keyword);

    boolean existsBySlug(String slug);
}
