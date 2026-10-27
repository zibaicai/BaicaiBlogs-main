package com.baicaiblogs.repository;

import com.baicaiblogs.entity.SuggestionImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SuggestionImageRepository extends JpaRepository<SuggestionImage, Long> {
    List<SuggestionImage> findBySuggestionIdOrderBySortOrderAscIdAsc(Long suggestionId);
    List<SuggestionImage> findByIdInAndUserId(List<Long> ids, Long userId);
    long countByUserIdAndSuggestionIdIsNull(Long userId);
}
