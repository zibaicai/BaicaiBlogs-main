package com.baicaiblogs.config;

import com.baicaiblogs.entity.Project;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.repository.ProjectRepository;
import com.baicaiblogs.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    @Bean
    @Transactional
    public CommandLineRunner initData(UserRepository userRepository,
                                      ProjectRepository projectRepository,
                                      PasswordEncoder passwordEncoder) {
        return args -> {
            // 1. 确保管理员用户存在
            User admin = userRepository.findByUsername("admin").orElseGet(() -> {
                User u = User.builder()
                        .username("admin")
                        .password(passwordEncoder.encode("admin123"))
                        .role("ADMIN")
                        .build();
                return userRepository.save(u);
            });

            final Long adminId = admin.getId();

            // 2. 为旧数据补全 userId（升级时的迁移）
            List<Project> orphans = projectRepository.findAllByOrderBySortOrderAsc().stream()
                    .filter(p -> p.getUserId() == null)
                    .toList();
            if (!orphans.isEmpty()) {
                orphans.forEach(p -> p.setUserId(adminId));
                projectRepository.saveAll(orphans);
                log.info("[DataInitializer] 已为 {} 个旧项目分配 userId={}", orphans.size(), adminId);
            }

            // 3. 如果 admin 用户还没有任何项目，则插入 data/projects.ts 的默认样例
            long mine = projectRepository.findByUserIdOrderBySortOrderAsc(adminId).size();
            if (mine == 0) {
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
        };
    }
}
