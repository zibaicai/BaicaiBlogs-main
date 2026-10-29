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
    List<Moment> findByStatusAndVisibilityOrderByDateDesc(String status, String visibility);
    List<Moment> findByUserIdOrderByDateDesc(Long userId);
    List<Moment> findByStatusOrderByDateDesc(String status);
    List<Moment> findByVisibilityOrderByDateDesc(String visibility);

    @org.springframework.data.jpa.repository.Query(
            "SELECT m FROM Moment m WHERE m.userId = :userId AND m.status = 'PUBLISHED' AND m.visibility = 'PUBLIC' ORDER BY m.date DESC")
    List<Moment> findPublishedPublicByUserId(@org.springframework.data.repository.query.Param("userId") Long userId);
}
