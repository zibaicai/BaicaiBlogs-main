package com.baicaiblogs.repository;

import com.baicaiblogs.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {
    Optional<Tag> findByNameIgnoreCase(String name);
    List<Tag> findByStatusOrderByCreatedAtDesc(String status);
    List<Tag> findAllByOrderByCreatedAtDesc();
}
