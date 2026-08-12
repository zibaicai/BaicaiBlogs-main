package com.baicaiblogs.repository;

import com.baicaiblogs.entity.Chatter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatterRepository extends JpaRepository<Chatter, Long> {
    Optional<Chatter> findBySlug(String slug);
    void deleteBySlug(String slug);
    boolean existsBySlug(String slug);

    List<Chatter> findAllByOrderByDateDesc();
    Page<Chatter> findAllByOrderByDateDesc(Pageable pageable);
}
