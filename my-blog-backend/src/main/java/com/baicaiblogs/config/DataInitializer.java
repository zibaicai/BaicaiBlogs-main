package com.baicaiblogs.config;

import com.baicaiblogs.entity.Post;
import com.baicaiblogs.entity.Project;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.repository.PostRepository;
import com.baicaiblogs.repository.ProjectRepository;
import com.baicaiblogs.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 数据初始化器
 *
 * 职责：
 * 1. 确保管理员用户 admin/admin123 存在
 * 2. 为旧数据（升级前创建的、userId 为 null 的 Project / Post）补全 userId，迁移到 admin 用户名下
 * 3. 如果 admin 用户没有任何文章，则插入示例文章（便于首次部署后立即看到效果）
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    @Bean
    @Transactional
    public CommandLineRunner initData(UserRepository userRepository,
                                      ProjectRepository projectRepository,
                                      PostRepository postRepository,
                                      PasswordEncoder passwordEncoder) {
        return args -> {
            // ===== 1. 确保管理员用户存在 =====
            User admin = userRepository.findByUsername("admin").orElseGet(() -> {
                User u = User.builder()
                        .username("admin")
                        .password(passwordEncoder.encode("admin123"))
                        .role("ADMIN")
                        .build();
                return userRepository.save(u);
            });

            final Long adminId = admin.getId();

            // ===== 2. 迁移旧的 Project 数据（userId 为 null 的补全为 admin） =====
            List<Project> orphanProjects = projectRepository.findAllByOrderBySortOrderAsc().stream()
                    .filter(p -> p.getUserId() == null)
                    .toList();
            if (!orphanProjects.isEmpty()) {
                orphanProjects.forEach(p -> p.setUserId(adminId));
                projectRepository.saveAll(orphanProjects);
                log.info("[DataInitializer] 已为 {} 个旧项目分配 userId={}", orphanProjects.size(), adminId);
            }

            // ===== 3. 如果 admin 用户还没有任何项目，则插入默认样例 =====
            long projectCount = projectRepository.findByUserIdOrderBySortOrderAsc(adminId).size();
            if (projectCount == 0) {
                Project sample = Project.builder()
                        .projectId("proj_1775049332705")
                        .userId(adminId)
                        .name("Computational Chemistry Tool")
                        .githubUrl("https://github.com/heiehiehi/Computational_Chemistry_Tool")
                        .description("该工具本作者使用在Win下的WSL2平台，系统为Ubuntu22，个人使用请依据自己数据进行修改（这些工具只是整合了一些流程）")
                        .icon("🚀")
                        .tags("[\"Gromacs\",\"RMSF\"]")
                        .sortOrder(0)
                        .build();
                projectRepository.save(sample);
                log.info("[DataInitializer] 已为 admin 初始化示例项目 Computational Chemistry Tool");
            }

            // ===== 4. 迁移旧的 Post 数据（userId 为 null 的补全为 admin） =====
            List<Post> orphanPosts = postRepository.findAll().stream()
                    .filter(p -> p.getUserId() == null)
                    .toList();
            if (!orphanPosts.isEmpty()) {
                orphanPosts.forEach(p -> p.setUserId(adminId));
                postRepository.saveAll(orphanPosts);
                log.info("[DataInitializer] 已为 {} 篇旧文章分配 userId={}", orphanPosts.size(), adminId);
            }

            // ===== 5. 如果 admin 用户还没有任何文章，则插入示例文章 =====
            long postCount = postRepository.findAllByUserId(adminId).size();
            if (postCount == 0) {
                Post samplePost = Post.builder()
                        .slug("welcome-to-my-blog")
                        .userId(adminId)
                        .title("欢迎来到我的博客")
                        .description("这是第一篇示例文章，展示时间线功能。你可以在编辑器中修改或删除它。")
                        .content("# 欢迎来到我的博客\n\n这是第一篇示例文章。\n\n## 功能特性\n\n- 支持 Markdown 语法\n- 支持标签分类\n- 支持时间线展示\n\n```python\nprint('Hello, World!')\n```\n\n> 开始你的创作之旅吧！")
                        .htmlContent("<h1>欢迎来到我的博客</h1>\n<p>这是第一篇示例文章。</p>\n<h2>功能特性</h2>\n<ul>\n<li>支持 Markdown 语法</li>\n<li>支持标签分类</li>\n<li>支持时间线展示</li>\n</ul>\n<pre><code>print('Hello, World!')</code></pre>\n<blockquote>开始你的创作之旅吧！</blockquote>")
                        .tags("[\"公告\",\"入门\"]")
                        .cover("https://bu.dusays.com/2026/03/24/69c1e38b346cb.jpg")
                        .date(LocalDateTime.now())
                        .status("PUBLISHED")
                        .views(0)
                        .build();
                postRepository.save(samplePost);
                log.info("[DataInitializer] 已为 admin 初始化示例文章「欢迎来到我的博客」");
            }
        };
    }
}
