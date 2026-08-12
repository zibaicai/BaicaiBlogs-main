package com.baicaiblogs.service;

import com.baicaiblogs.dto.*;
import com.baicaiblogs.entity.Project;
import com.baicaiblogs.repository.ProjectRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<ProjectResponse> getAllProjects() {
        return projectRepository.findAllByOrderBySortOrderAsc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectResponse createProject(ProjectRequest request) {
        if (projectRepository.existsByProjectId(request.getProjectId())) {
            throw new RuntimeException("Project ID 已存在: " + request.getProjectId());
        }

        Project project = Project.builder()
                .projectId(request.getProjectId())
                .name(request.getName())
                .description(request.getDescription())
                .icon(request.getIcon())
                .githubUrl(request.getGithubUrl())
                .tags(serializeTags(request.getTags()))
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .build();

        return toResponse(projectRepository.save(project));
    }

    @Transactional
    public ProjectResponse updateProject(String projectId, ProjectRequest request) {
        Project project = projectRepository.findByProjectId(projectId)
                .orElseThrow(() -> new RuntimeException("项目不存在: " + projectId));

        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setIcon(request.getIcon());
        project.setGithubUrl(request.getGithubUrl());
        project.setTags(serializeTags(request.getTags()));
        if (request.getSortOrder() != null) {
            project.setSortOrder(request.getSortOrder());
        }

        return toResponse(projectRepository.save(project));
    }

    @Transactional
    public void deleteProject(String projectId) {
        if (!projectRepository.existsByProjectId(projectId)) {
            throw new RuntimeException("项目不存在: " + projectId);
        }
        projectRepository.deleteByProjectId(projectId);
    }

    private String serializeTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(tags);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private List<String> deserializeTags(String tagsJson) {
        if (tagsJson == null || tagsJson.isEmpty()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(tagsJson, objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    private ProjectResponse toResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .projectId(project.getProjectId())
                .name(project.getName())
                .description(project.getDescription())
                .icon(project.getIcon())
                .githubUrl(project.getGithubUrl())
                .tags(deserializeTags(project.getTags()))
                .sortOrder(project.getSortOrder())
                .build();
    }
}
