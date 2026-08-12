package com.baicaiblogs.repository;

import com.baicaiblogs.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    Optional<Project> findByProjectId(String projectId);
    void deleteByProjectId(String projectId);
    boolean existsByProjectId(String projectId);
    List<Project> findAllByOrderBySortOrderAsc();
}
