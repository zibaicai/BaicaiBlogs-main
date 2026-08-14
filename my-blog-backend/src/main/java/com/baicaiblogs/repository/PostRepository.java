package com.baicaiblogs.repository;

import com.baicaiblogs.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    Optional<Post> findBySlug(String slug);
    List<Post> findByStatusOrderByDateDesc(String status);
    Page<Post> findByStatus(String status, Pageable pageable);
    void deleteBySlug(String slug);

    // ===== 按用户隔离的查询方法（时间线/管理后台使用） =====

    /** 查询某用户的所有已发布文章，按发布时间倒序 */
    @Query("SELECT p FROM Post p WHERE p.userId = :userId AND p.status = 'PUBLISHED' ORDER BY p.date DESC")
    List<Post> findPublishedByUserId(@Param("userId") Long userId);

    /** 查询某用户的全部文章（不限状态），按发布时间倒序 */
    @Query("SELECT p FROM Post p WHERE p.userId = :userId ORDER BY p.date DESC")
    List<Post> findAllByUserId(@Param("userId") Long userId);

    /** 按 slug + userId 组合查询，用于越权防护 */
    Optional<Post> findBySlugAndUserId(String slug, Long userId);

    /** 按 slug + userId 组合判断存在性，用于越权防护 */
    boolean existsBySlugAndUserId(String slug, Long userId);

    /** 按 slug + userId 组合删除，避免越权删除他人文章 */
    void deleteBySlugAndUserId(String slug, Long userId);

    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' ORDER BY p.date DESC")
    List<Post> findAllPublished();

    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' ORDER BY p.date DESC")
    Page<Post> findAllPublished(Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' AND (p.title LIKE %:keyword% OR p.description LIKE %:keyword%)")
    List<Post> searchPublished(String keyword);

    boolean existsBySlug(String slug);
}
