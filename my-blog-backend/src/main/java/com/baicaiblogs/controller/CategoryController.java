package com.baicaiblogs.controller;

import com.baicaiblogs.dto.ApiResponse;
import com.baicaiblogs.dto.CategoryRequest;
import com.baicaiblogs.dto.CategoryResponse;
import com.baicaiblogs.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping("/public/categories")
    public ApiResponse<List<CategoryResponse>> publicList() {
        try {
            return ApiResponse.success(categoryService.listAll());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/admin/categories")
    public ApiResponse<List<CategoryResponse>> adminList() {
        try {
            return ApiResponse.success(categoryService.listAll());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/categories")
    public ApiResponse<CategoryResponse> create(@RequestBody CategoryRequest request) {
        try {
            return ApiResponse.success("创建成功", categoryService.create(request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/admin/categories/{id}")
    public ApiResponse<CategoryResponse> update(@PathVariable Long id, @RequestBody CategoryRequest request) {
        try {
            return ApiResponse.success("更新成功", categoryService.update(id, request));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/admin/categories/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        try {
            categoryService.delete(id);
            return ApiResponse.success("删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
