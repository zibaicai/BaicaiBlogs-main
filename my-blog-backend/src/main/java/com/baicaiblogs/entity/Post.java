package com.baicaiblogs.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "posts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 200)
    private String slug;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** 文章 Markdown 原文 */
    @Column(nullable = false, columnDefinition = "MEDIUMTEXT")
    private String content;

    /** 文章渲染后的 HTML（由 commonmark 解析生成） */
    @Column(name = "html_content", columnDefinition = "MEDIUMTEXT")
    private String htmlContent;

    /** 文章标签列表，以 JSON 数组字符串形式存储，例如 ["React","Spring Boot"] */
    @Column(columnDefinition = "JSON")
    private String tags;

    /** 封面图 URL */
    @Column(length = 500)
    private String cover;

    /** 发布时间（前端时间线排序依据） */
    @Column(nullable = false)
    private LocalDateTime date;

    /** 归属用户 ID（实现按用户隔离，admin 只能操作自己的文章） */
    @Column(name = "user_id")
    private Long userId;

    @Column(length = 20)
    private String status = "PUBLISHED";

    @Builder.Default
    private Integer views = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
