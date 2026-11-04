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
@Table(name = "articles", indexes = {
        @Index(name = "idx_article_public", columnList = "status,visibility,published_at"),
        @Index(name = "idx_article_author", columnList = "user_id,created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Article {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, unique = true, length = 180)
    private String slug;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 300)
    private String subtitle;

    @Column(length = 500)
    private String cover;

    @Column(length = 500)
    private String summary;

    @Column(name = "content_html", nullable = false, columnDefinition = "LONGTEXT")
    private String contentHtml;

    @Column(name = "content_text", columnDefinition = "LONGTEXT")
    private String contentText;

    @Column(length = 60)
    private String category;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(length = 1000)
    private String tags;

    /** DRAFT / PENDING_REVIEW / PUBLISHED / REJECTED / ARCHIVED */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "DRAFT";

    @Column(name = "review_note", length = 1000)
    private String reviewNote;

    @Column(name = "submitted_at")
    private java.time.LocalDateTime submittedAt;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private java.time.LocalDateTime reviewedAt;

    /** PUBLIC / PRIVATE */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String visibility = "PUBLIC";

    @Column(name = "reading_time")
    private Integer readingTime;

    @Column(name = "source_platform", length = 40)
    private String sourcePlatform;

    @Column(name = "source_url", length = 1000)
    private String sourceUrl;

    @Column(name = "source_author", length = 255)
    private String sourceAuthor;

    @Column(name = "source_archive_id")
    private Long sourceArchiveId;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
