package com.baicaiblogs.repository;

import com.baicaiblogs.entity.Moment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MomentRepository extends JpaRepository<Moment, Long> {
    Optional<Moment> findBySlug(String slug);
    void deleteBySlug(String slug);
    boolean existsBySlug(String slug);

    List<Moment> findAllByOrderByDateDesc();
}
