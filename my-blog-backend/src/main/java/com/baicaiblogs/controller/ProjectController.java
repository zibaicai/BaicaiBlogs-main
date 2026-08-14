package com.baicaiblogs.controller;

import com.baicaiblogs.dto.*;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping("/public/projects")
    public ApiResponse<List<ProjectResponse>> getAllProjects() {
        try {
            return ApiResponse.success(projectService.getAllProjects());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/admin/projects/mine")
    public ApiResponse<List<ProjectResponse>> getMyProjects() {
        try {
            Long userId = getCurrentUserId();
            return ApiResponse.success(projectService.getProjectsByUser(userId));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/projects")
    public ApiResponse<ProjectResponse> createProject(@RequestBody ProjectRequest request) {
        try {
            Long userId = getCurrentUserId();
            return ApiResponse.success("创建成功", projectService.createProject(userId, request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/admin/projects/{projectId}")
    public ApiResponse<ProjectResponse> updateProject(@PathVariable String projectId,
                                                      @RequestBody ProjectRequest request) {
        try {
            Long userId = getCurrentUserId();
            return ApiResponse.success("更新成功", projectService.updateProject(userId, projectId, request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/admin/projects/{projectId}")
    public ApiResponse<Void> deleteProject(@PathVariable String projectId) {
        try {
            Long userId = getCurrentUserId();
            projectService.deleteProject(userId, projectId);
            return ApiResponse.success("删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User) {
            return ((User) principal).getId();
        }
        throw new RuntimeException("用户未登录");
    }
}
