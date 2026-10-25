package com.baicaiblogs.service;

import com.baicaiblogs.dto.CategoryRequest;
import com.baicaiblogs.dto.CategoryResponse;
import com.baicaiblogs.entity.Category;
import com.baicaiblogs.repository.CategoryRepository;
import com.baicaiblogs.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final PostRepository postRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> listAll() {
        return categoryRepository.findAllByOrderByDepthAscSortAscNameAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new RuntimeException("分类名称不能为空");
        }
        String slug = request.getSlug() == null || request.getSlug().isBlank()
                ? "category-" + System.currentTimeMillis()
                : request.getSlug().trim();
        if (categoryRepository.existsBySlug(slug)) {
            throw new RuntimeException("分类 slug 已存在: " + slug);
        }
        Category parent = null;
        int depth = 1;
        String path = request.getName().trim();
        if (request.getParentId() != null) {
            parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new RuntimeException("父分类不存在"));
            depth = parent.getDepth() + 1;
            if (depth > 4) throw new RuntimeException("分类最多 4 级");
            path = parent.getPath() + "/" + request.getName().trim();
        }
        Category category = Category.builder()
                .name(request.getName().trim())
                .slug(slug)
                .parentId(parent == null ? null : parent.getId())
                .path(path)
                .depth(depth)
                .sort(request.getSort() == null ? 0 : request.getSort())
                .build();
        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("分类不存在"));
        if (request.getName() == null || request.getName().isBlank()) {
            throw new RuntimeException("分类名称不能为空");
        }
        if (request.getParentId() != null && !request.getParentId().equals(category.getParentId())) {
            throw new RuntimeException("暂不支持修改分类父级，请新建分类后迁移资源");
        }
        String oldPath = category.getPath();
        String newPath = category.getParentId() == null
                ? request.getName().trim()
                : oldPath.substring(0, oldPath.lastIndexOf('/')) + "/" + request.getName().trim();
        category.setName(request.getName().trim());
        category.setPath(newPath);
        if (request.getSort() != null) category.setSort(request.getSort());
        categoryRepository.save(category);
        // Keep descendants' display paths in sync.
        if (!oldPath.equals(newPath)) {
            categoryRepository.findAll().stream()
                    .filter(item -> item.getPath().startsWith(oldPath + "/"))
                    .forEach(item -> {
                        item.setPath(newPath + item.getPath().substring(oldPath.length()));
                        categoryRepository.save(item);
                    });
        }
        return toResponse(category);
    }

    @Transactional
    public void delete(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("分类不存在"));
        if (categoryRepository.existsByParentId(id)) {
            throw new RuntimeException("请先处理该分类的子分类");
        }
        if (postRepository.countByCategoryId(id) > 0) {
            throw new RuntimeException("该分类下还有文章，请先迁移");
        }
        categoryRepository.delete(category);
    }

    private CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .parentId(category.getParentId())
                .path(category.getPath())
                .depth(category.getDepth())
                .sort(category.getSort())
                .build();
    }
}
