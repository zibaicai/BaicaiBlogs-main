package com.baicaiblogs.repository;

import com.baicaiblogs.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findBySlug(String slug);
    boolean existsBySlug(String slug);
    boolean existsByParentId(Long parentId);
    List<Category> findAllByOrderByDepthAscSortAscNameAsc();
    List<Category> findByParentIdOrderBySortAscNameAsc(Long parentId);
}
