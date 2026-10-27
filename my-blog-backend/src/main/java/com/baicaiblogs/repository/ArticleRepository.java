package com.baicaiblogs.repository;

import com.baicaiblogs.entity.Article;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {
    Optional<Article> findBySlug(String slug);
    boolean existsBySlug(String slug);
    List<Article> findByStatusAndVisibilityOrderByPublishedAtDesc(String status, String visibility);
    List<Article> findAllByOrderByCreatedAtDesc();
    List<Article> findByUserIdOrderByCreatedAtDesc(Long userId);
}
