package com.baicaiblogs.repository;

import com.baicaiblogs.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    Optional<Project> findByProjectId(String projectId);
    Optional<Project> findByProjectIdAndUserId(String projectId, Long userId);
    void deleteByProjectId(String projectId);
    void deleteByProjectIdAndUserId(String projectId, Long userId);
    boolean existsByProjectId(String projectId);
    boolean existsByProjectIdAndUserId(String projectId, Long userId);
    List<Project> findAllByOrderBySortOrderAsc();
    List<Project> findByUserIdOrderBySortOrderAsc(Long userId);
}
