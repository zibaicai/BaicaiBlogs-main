package com.baicaiblogs.controller;

import com.baicaiblogs.dto.*;
import com.baicaiblogs.service.ProjectService;
import lombok.RequiredArgsConstructor;
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

    @PostMapping("/admin/projects")
    public ApiResponse<ProjectResponse> createProject(@RequestBody ProjectRequest request) {
        try {
            return ApiResponse.success("创建成功", projectService.createProject(request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/admin/projects/{projectId}")
    public ApiResponse<ProjectResponse> updateProject(@PathVariable String projectId,
                                                      @RequestBody ProjectRequest request) {
        try {
            return ApiResponse.success("更新成功", projectService.updateProject(projectId, request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/admin/projects/{projectId}")
    public ApiResponse<Void> deleteProject(@PathVariable String projectId) {
        try {
            projectService.deleteProject(projectId);
            return ApiResponse.success("删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
