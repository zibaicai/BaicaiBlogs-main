package com.baicaiblogs.config;

import com.baicaiblogs.entity.Category;
import com.baicaiblogs.repository.CategoryRepository;
import com.baicaiblogs.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class CategorySeedConfig {

    private final CategoryRepository categoryRepository;
    private final PostRepository postRepository;

    @Bean
    CommandLineRunner seedDefaultCategories() {
        return args -> {
            if (categoryRepository.count() > 0) return;
            Category tech = categoryRepository.save(Category.builder()
                    .name("技术").slug("tech").path("技术").depth(1).sort(10).build());
            categoryRepository.save(Category.builder()
                    .name("生活").slug("life").path("生活").depth(1).sort(20).build());
            categoryRepository.save(Category.builder()
                    .name("随笔").slug("notes").path("随笔").depth(1).sort(30).build());
            Category uncategorized = categoryRepository.save(Category.builder()
                    .name("未分类").slug("uncategorized").path("未分类").depth(1).sort(999).build());
            List<Category> existing = categoryRepository.findAll();
            existing.forEach(category -> {
                categoryRepository.save(category);
            });
            postRepository.findAll().stream()
                    .filter(post -> post.getCategoryId() == null)
                    .forEach(post -> {
                        post.setCategoryId(uncategorized.getId());
                        postRepository.save(post);
                    });
            // Keep the created roots in a deterministic order; tech is intentionally first.
            tech.setSort(10);
            categoryRepository.save(tech);
        };
    }
}
