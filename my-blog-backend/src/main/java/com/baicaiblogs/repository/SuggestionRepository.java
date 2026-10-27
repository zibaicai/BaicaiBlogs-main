package com.baicaiblogs.repository;

import com.baicaiblogs.entity.Suggestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SuggestionRepository extends JpaRepository<Suggestion, Long> {
    List<Suggestion> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Suggestion> findAllByOrderByCreatedAtDesc();
    List<Suggestion> findByStatusOrderByCreatedAtDesc(String status);
}
